import { Service, Container } from 'typedi';
import { OtpAttemptModel } from '../models/otp-attempt.model';
import { Logger } from 'winston';

@Service()
export class OtpLimiterService {
  private logger: Logger = Container.get("logger");
  private maxAttempts = 3; // Maximum allowed attempts per day
  
  constructor() {}

  /**
   * Check if a phone number has reached its daily OTP limit
   * @param phoneNumber The phone number to check
   * @returns Object with status of the check and details
   */
  public async checkLimit(phoneNumber: string): Promise<{
    allowed: boolean;
    attemptsLeft: number;
    resetAt?: Date;
    message?: string;
  }> {
    try {
      // Find or create the attempt record for this phone
      let attemptRecord = await OtpAttemptModel.findOne({ phoneNumber });
      
      if (!attemptRecord) {
        // First attempt for this phone number
        attemptRecord = await OtpAttemptModel.create({
          phoneNumber,
          attempts: 0,
        });
      }
      
      // Check if we need to reset (midnight has passed since resetAt)
      const now = new Date();
      if (now > attemptRecord.resetAt) {
        attemptRecord.attempts = 0;
        attemptRecord.lastAttempt = now;
        
        // Calculate next reset time (midnight tonight)
        const resetTime = new Date();
        resetTime.setDate(resetTime.getDate() + 1);
        resetTime.setHours(0, 0, 0, 0);
        attemptRecord.resetAt = resetTime;
        
        await attemptRecord.save();
        
        return {
          allowed: true,
          attemptsLeft: this.maxAttempts - 1,
        };
      }
      
      // Check if limit is reached
      if (attemptRecord.attempts >= this.maxAttempts) {
        return {
          allowed: false,
          attemptsLeft: 0,
          resetAt: attemptRecord.resetAt,
          message: `Daily OTP limit reached. Try again after ${attemptRecord.resetAt.toLocaleTimeString()}`,
        };
      }
      
      // Increment the attempt counter
      attemptRecord.attempts += 1;
      attemptRecord.lastAttempt = now;
      await attemptRecord.save();
      
      return {
        allowed: true,
        attemptsLeft: this.maxAttempts - attemptRecord.attempts,
      };
    } catch (error) {
      this.logger.error(`Error checking OTP limit: ${error.message}`);
      // If there's an error, we'll allow the attempt but log the error
      return {
        allowed: true,
        attemptsLeft: 0,
        message: 'Error checking OTP limit',
      };
    }
  }
  
  /**
   * Record a successful verification to potentially reset counter
   * @param phoneNumber The phone number that was successfully verified
   */
  public async recordSuccessfulVerification(phoneNumber: string): Promise<void> {
    try {
      // Optionally, we could reset the counter on successful verification
      // For now, we'll just log it
      this.logger.info(`OTP successfully verified for ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Error recording successful verification: ${error.message}`);
    }
  }
}