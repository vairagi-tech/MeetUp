import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private client: RedisClientType;
  private connected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      console.log('⚠️ Redis disconnected');
      this.connected = false;
    });

    // Connect to Redis
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Continue without Redis if connection fails
      this.connected = false;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async set(key: string, value: string, expiration?: number): Promise<void> {
    if (!this.connected) return;
    
    try {
      if (expiration) {
        await this.client.setEx(key, expiration, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.connected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.connected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        await this.client.disconnect();
      } catch (error) {
        console.error('Redis disconnect error:', error);
      }
    }
  }

  // Get the underlying Redis client for advanced operations
  public getClient(): RedisClientType {
    return this.client;
  }
}
