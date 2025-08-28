import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  emit: (event: string, data?: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      // Connect to WebSocket server
      const socketUrl = process.env.REACT_APP_WS_URL || 'http://localhost:3001';
      
      socketRef.current = io(socketUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      });

      // User status events
      socket.on('user:online', (data: { userId: string }) => {
        setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
      });

      socket.on('user:offline', (data: { userId: string }) => {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      });

      // Location events
      socket.on('location:update', (data: { userId: string; location: any }) => {
        // Handle location updates
        console.log('Location update:', data);
      });

      socket.on('location:nearby', (data: { users: string[] }) => {
        // Handle nearby users notification
        console.log('Nearby users:', data);
      });

      // Notification events
      socket.on('notification:new', (notification: any) => {
        // Handle new notifications
        console.log('New notification:', notification);
        
        // You can dispatch to a notification context or show toast
        // toast.info(notification.message);
      });

      // Free time events
      socket.on('freetime:found', (data: { users: string[]; slots: any[] }) => {
        // Handle free time found notification
        console.log('Free time found:', data);
      });

      // Group events
      socket.on('group:invite', (data: { groupId: string; inviterId: string }) => {
        // Handle group invitation
        console.log('Group invite:', data);
      });

      socket.on('group:joined', (data: { groupId: string; userId: string }) => {
        // Handle user joined group
        console.log('User joined group:', data);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      };
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
    };
  }, [isAuthenticated, token]);

  const joinRoom = (roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join:room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave:room', roomId);
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    emit,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Hook to use socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Custom hooks for specific socket events
export const useLocationSharing = () => {
  const { emit, socket } = useSocket();

  const updateLocation = (location: { latitude: number; longitude: number; accuracy: number }) => {
    emit('location:update', location);
  };

  const requestNearbyUsers = () => {
    emit('location:request-nearby');
  };

  return { updateLocation, requestNearbyUsers };
};

export const useNotifications = () => {
  const { emit, socket } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (socket) {
      socket.on('notification:new', (notification: any) => {
        setNotifications(prev => [notification, ...prev]);
      });

      socket.on('notification:read', (data: { notificationId: string }) => {
        setNotifications(prev => 
          prev.map(n => 
            n.id === data.notificationId 
              ? { ...n, isRead: true }
              : n
          )
        );
      });

      return () => {
        socket.off('notification:new');
        socket.off('notification:read');
      };
    }
  }, [socket]);

  const markAsRead = (notificationId: string) => {
    emit('notification:read', { notificationId });
  };

  return { notifications, markAsRead };
};
