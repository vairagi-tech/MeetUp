import { Server as SocketIOServer, Socket } from 'socket.io';
import { RedisClient } from '../config/redis';
import { JWTUtils } from '../../../../../shared/src/utils';
import { ISocketEvents } from '../../../../../shared/src/types';

export class SocketManager {
  private io: SocketIOServer;
  private redisClient: RedisClient;
  private connectedUsers = new Map<string, { socketId: string; userId: string; lastSeen: Date }>();

  constructor(io: SocketIOServer, redisClient: RedisClient) {
    this.io = io;
    this.redisClient = redisClient;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));
    
    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      const userId = (socket as any).userId;
      if (userId) {
        this.handleUserConnection(socket, userId);
      }

      socket.on('disconnect', () => {
        this.handleUserDisconnection(socket);
      });

      // Handle location updates
      socket.on('location:update', (locationData) => {
        this.handleLocationUpdate(socket, locationData);
      });

      // Handle notification acknowledgments
      socket.on('notification:read', (data) => {
        this.handleNotificationRead(socket, data);
      });

      // Handle join/leave room events
      socket.on('join:room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on('leave:room', (roomId) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      });
    });
  }

  private async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('JWT secret not configured'));
      }

      const decoded = JWTUtils.verifyToken(token, jwtSecret);
      (socket as any).userId = decoded.userId;
      (socket as any).userEmail = decoded.email;
      
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  }

  private handleUserConnection(socket: Socket, userId: string): void {
    // Store user connection
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      userId,
      lastSeen: new Date()
    });

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Notify other services about user coming online
    this.broadcastToServices('user:online', { userId });

    // Store online status in Redis
    this.redisClient.set(`user:online:${userId}`, 'true', 3600); // 1 hour expiration

    console.log(`User ${userId} connected via socket ${socket.id}`);
  }

  private handleUserDisconnection(socket: Socket): void {
    const userId = (socket as any).userId;
    
    if (userId) {
      // Remove from connected users
      this.connectedUsers.delete(userId);

      // Notify other services about user going offline
      this.broadcastToServices('user:offline', { userId });

      // Remove online status from Redis
      this.redisClient.del(`user:online:${userId}`);

      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    }

    console.log(`Socket disconnected: ${socket.id}`);
  }

  private handleLocationUpdate(socket: Socket, locationData: any): void {
    const userId = (socket as any).userId;
    
    if (userId) {
      // Broadcast location update to friends/nearby users
      this.io.to(`location:nearby:${userId}`).emit('location:update', {
        userId,
        location: locationData
      });

      // Store location in Redis with short expiration
      this.redisClient.set(
        `user:location:${userId}`, 
        JSON.stringify(locationData), 
        300 // 5 minutes
      );
    }
  }

  private handleNotificationRead(socket: Socket, data: { notificationId: string }): void {
    const userId = (socket as any).userId;
    
    if (userId) {
      // Broadcast to other user devices
      socket.to(`user:${userId}`).emit('notification:read', data);
    }
  }

  // Public methods for other services to emit events

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Send notification to specific user
  public sendNotification(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:new', notification);
  }

  // Handle friend proximity alerts
  public notifyNearbyUsers(userIds: string[], data: any): void {
    userIds.forEach(userId => {
      this.emitToUser(userId, 'location:nearby', data);
    });
  }

  // Handle group events
  public notifyGroupMembers(groupId: string, event: string, data: any): void {
    this.emitToRoom(`group:${groupId}`, event, data);
  }

  // Handle free time alerts
  public notifyFreeTimeFound(userIds: string[], data: any): void {
    userIds.forEach(userId => {
      this.emitToUser(userId, 'freetime:found', data);
    });
  }

  // Get connection statistics
  public getConnectionCount(): number {
    return this.connectedUsers.size;
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Broadcast events to other microservices (can be enhanced with message queues)
  private broadcastToServices(event: string, data: any): void {
    // This could be enhanced to use Redis pub/sub or message queues
    // to communicate with other microservices
    console.log(`Broadcasting ${event} to services:`, data);
  }

  // Clean up expired connections
  public cleanupConnections(): void {
    const now = new Date();
    const expiredUsers: string[] = [];

    this.connectedUsers.forEach((connection, userId) => {
      // Clean up connections older than 1 hour
      if (now.getTime() - connection.lastSeen.getTime() > 3600000) {
        expiredUsers.push(userId);
      }
    });

    expiredUsers.forEach(userId => {
      this.connectedUsers.delete(userId);
      this.redisClient.del(`user:online:${userId}`);
    });

    if (expiredUsers.length > 0) {
      console.log(`Cleaned up ${expiredUsers.length} expired connections`);
    }
  }
}

// Set up periodic cleanup
setInterval(() => {
  // This will be called by the instance
}, 300000); // 5 minutes
