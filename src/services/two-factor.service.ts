import { Service, Container } from 'typedi';
import axios from 'axios';
import { nodeEnv, testUsers, twoFactorConfig } from '../config/constants';
import { Logger } from 'winston';
import { OtpLimiterService } from './otp-limiter.service';

interface OtpResponse {
  Status: 'Success' | 'Error';
  Details: string;
  code?: string;
  attemptsLeft?: number;
  nextAttemptTime?: string;
}

@Service()
export class TwoFactorService {
  private logger: Logger = Container.get("logger");
  private otpLimiterService: OtpLimiterService = Container.get(OtpLimiterService);

  constructor() {}

  public async sendVerificationCode(phoneNumber: string): Promise<OtpResponse> {
    try {
      // if test user
      if (testUsers.find(user => user.phoneNumber === phoneNumber)) {
        return {
          Status: 'Success',
          Details: 'OTP sent successfully',
        };
      }
      // Check if the phone number has reached the daily limit

      const limitCheck = await this.otpLimiterService.checkLimit(phoneNumber);
      
      if (!limitCheck.allowed) {
        return {
          Status: 'Error',
          Details: limitCheck.message || 'Daily OTP limit reached',
          attemptsLeft: limitCheck.attemptsLeft,
          nextAttemptTime: limitCheck.resetAt ? limitCheck.resetAt.toISOString() : undefined
        };
      }
      
      const url = `${twoFactorConfig.URL}/${twoFactorConfig.API_KEY}/SMS/${phoneNumber}/AUTOGEN3/${twoFactorConfig.TEMPLATE_NAME}`;
      
      const response = await axios.get(url);
      
      if (response.data && response.data.Status === 'Success') {
        this.logger.info(`OTP sent to ${phoneNumber} via 2Factor`);
        
        return {
          Status: 'Success',
          Details: 'OTP sent successfully',
          code: nodeEnv === 'development' ? response.data.Details : "", // This should only be included in development
          attemptsLeft: limitCheck.attemptsLeft
        };
      } else {
        throw new Error(response.data?.Details || 'Unknown error from 2Factor API');
      }
    } catch (error) {
      this.logger.error(`Failed to send OTP via 2Factor: ${error.message}`);
      
      return {
        Status: 'Error',
        Details: 'Failed to send OTP'
      };
    }
  }

  public async verifyCode(phoneNumber: string, code: string): Promise<OtpResponse> {
    try {
      // if test user
      if (testUsers.find(user => user.phoneNumber === phoneNumber)) {
        return {
          Status: 'Success',
          Details: 'OTP verified successfully'
        };
      }
      const url = `${twoFactorConfig.URL}/${twoFactorConfig.API_KEY}/SMS/VERIFY3/${phoneNumber}/${code}`;
      
      const response = await axios.get(url);
      
      if (response.data && response.data.Status === 'Success') {
        this.logger.info(`OTP verified for ${phoneNumber}`);
        
        return {
          Status: 'Success',
          Details: 'OTP verified successfully'
        };
      } else {
        this.logger.info(`OTP verification failed for ${phoneNumber}: ${response.data?.Details}`);
        
        return {
          Status: 'Error',
          Details: 'Invalid OTP or verification failed'
        };
      }
    } catch (error) {
      this.logger.error(`OTP verification error: ${error.message}`);
      
      return {
        Status: 'Error',
        Details: 'Failed to verify OTP'
      };
    }
  }
}
