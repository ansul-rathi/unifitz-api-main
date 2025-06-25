import {Container, Service } from 'typedi';
import Redis, { Redis as RedisClient } from 'ioredis';
import { Logger } from 'winston';
import { redisConfig } from '@config/constants';

@Service()
export class RedisService {
  private static instance: RedisService;
  private client: RedisClient;
  private logger: Logger;


  
  constructor() {
    if (RedisService.instance) {
      return RedisService.instance;
    }
    
    this.logger = Container.get('logger');
    this.client = this.createClient();
    RedisService.instance = this;
  }
  
  private createClient(): RedisClient {
    const client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
    
    client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
    
    client.on('connect', () => {
      this.logger.info('Connected to Redis');
    });
    
    client.on('ready', () => {
      this.logger.info('Redis client is ready');
    });
    
    return client;
  }

  /**
   * Get Redis client instance
   */
  public getClient(): RedisClient {
    return this.client;
  }
  
  /**
   * Basic key-value operations
   */
  public async set(key: string, value: string, expireSeconds?: number): Promise<string> {
    if (expireSeconds) {
      return this.client.set(key, value, 'EX', expireSeconds);
    }
    return this.client.set(key, value);
  }
  
  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
  
  public async del(key: string): Promise<number> {
    return this.client.del(key);
  }
  
  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
  
  public async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }
}