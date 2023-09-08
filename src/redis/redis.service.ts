import { Inject, Injectable } from '@nestjs/common';
import { Redis as IRedis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: IRedis) {}

  // STRING
  async set(key: string, value: string, ttl: number = 60) {
    const pipeline = this.redisClient.pipeline();
    pipeline.set(key, value);
    pipeline.expire(key, ttl);
    await pipeline.exec();
  }

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  async has(key: string) {
    return await this.redisClient.exists(key);
  }

  // SETS
  async sAdd(key: string, members: string[], ttl: number = 60) {
    const pipeline = this.redisClient.pipeline();
    pipeline.sadd(key, ...members);
    const randomExpiration = ttl + Math.floor(Math.random() * 11);
    pipeline.expire(key, randomExpiration);
    await pipeline.exec();
  }

  async sRem(key: string) {
    return await this.redisClient.srem(key);
  }

  // Get all value of key
  async sMembers(key: string) {
    return await this.redisClient.smembers(key);
  }
  // Check key is a member of sets
  async sIsMember(key: string, member: string) {
    return await this.redisClient.sismember(key, member);
  }
  // Get length
  async sCard(key: string) {
    return await this.redisClient.scard(key);
  }
  // Get common
  async sInter(key1: string, key2: string) {
    return await this.redisClient.sinter(key1, key2);
  }

  async ttl(key: string) {
    return await this.redisClient.ttl(key);
  }
}
