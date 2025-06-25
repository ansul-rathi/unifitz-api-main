import { Service } from 'typedi';
import { RedisService } from '../services/redis.service';

@Service()
export class OtpRepository {
  private redisService: RedisService;
  private readonly keyPrefix = 'otp:';
  private readonly defaultExpirySeconds = 600; // 10 minutes
  
  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }
  
  /**
   * Store OTP for a phone number
   */
  public async saveOtp(phoneNumber: string, otp: string, expirySeconds?: number): Promise<void> {
    const key = this.getKey(phoneNumber);
    await this.redisService.set(
      key, 
      otp, 
      expirySeconds || this.defaultExpirySeconds
    );
  }
  
  /**
   * Retrieve stored OTP for a phone number
   */
  public async getOtp(phoneNumber: string): Promise<string | null> {
    const key = this.getKey(phoneNumber);
    return this.redisService.get(key);
  }
  
  /**
   * Delete OTP for a phone number
   */
  public async deleteOtp(phoneNumber: string): Promise<void> {
    const key = this.getKey(phoneNumber);
    await this.redisService.del(key);
  }
  
  /**
   * Check if OTP exists for a phone number
   */
  public async otpExists(phoneNumber: string): Promise<boolean> {
    const key = this.getKey(phoneNumber);
    return this.redisService.exists(key);
  }
  
  /**
   * Create Redis key with prefix
   */
  private getKey(phoneNumber: string): string {
    return `${this.keyPrefix}${phoneNumber}`;
  }
}