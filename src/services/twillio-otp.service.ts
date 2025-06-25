import { Service, Container } from 'typedi';
import { Logger } from 'winston';
import { OtpRepository } from '../repositories/otp.repository';
// import twilio from 'twilio';

interface OtpResponse {
  Status: 'Success' | 'Error';
  Details: string;
  code?: string;
}

@Service()
export class OtpService {
  private logger: Logger;
  private otpRepository: OtpRepository;
  private twilioClient: any;
  private twilioPhoneNumber: string;
  private isDevelopment: boolean;
  
  constructor(otpRepository: OtpRepository) {
    this.logger = Container.get('logger');
    this.otpRepository = otpRepository;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Configure Twilio (only in production)
    if (!this.isDevelopment) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
      
      if (accountSid && authToken) {
        // todo: uncomment this line when Twilio is needed
        // this.twilioClient = twilio(accountSid, authToken);
      } else {
        this.logger.warn('Twilio credentials not provided');
      }
    }
  }
  
  /**
   * Send verification code via SMS
   */
  public async sendVerificationCode(phoneNumber: string): Promise<OtpResponse> {
    try {
      // Generate a new 6-digit OTP code
      const otp = this.generateOTP();
      
      // Store OTP in Redis (through repository)
      await this.otpRepository.saveOtp(phoneNumber, otp);
      
      // Handle OTP delivery based on environment
      if (this.isDevelopment) {
        // Development: just log the OTP
        this.logger.info(`[DEV] OTP sent to ${phoneNumber}: ${otp}`);
        
        return {
          Status: 'Success',
          Details: 'OTP sent successfully (dev mode)',
          code: otp // Only included in development
        };
      } else {
        // Production: send via Twilio if configured
        if (this.twilioClient) {
          const formattedNumber = this.formatPhoneNumber(phoneNumber);
          const message = await this.twilioClient.messages.create({
            body: `Your WinVibes verification code is: ${otp}. Valid for 10 minutes.`,
            from: this.twilioPhoneNumber,
            to: formattedNumber
          });
          
          this.logger.info(`OTP sent to ${phoneNumber}, Twilio SID: ${message.sid}`);
        } else {
          // Fallback if Twilio not configured
          this.logger.info(`OTP generated for ${phoneNumber}: ${otp} (Twilio not configured)`);
        }
        
        return {
          Status: 'Success',
          Details: 'OTP sent successfully'
        };
      }
    } catch (error: any) {
      this.logger.error(`Failed to send OTP: ${error.message}`, error);
      return {
        Status: 'Error',
        Details: 'Failed to send OTP'
      };
    }
  }
  
  /**
   * Verify code submitted by user
   */
  public async verifyCode(phoneNumber: string, code: string): Promise<OtpResponse> {
    try {
      // Get the stored OTP
      const storedOtp = await this.otpRepository.getOtp(phoneNumber);
      
      if (!storedOtp) {
        return {
          Status: 'Error',
          Details: 'OTP expired or not found'
        };
      }
      
      // Check if OTP matches
      if (storedOtp === code) {
        // Delete OTP after successful verification
        await this.otpRepository.deleteOtp(phoneNumber);
        
        return {
          Status: 'Success',
          Details: 'OTP verified successfully'
        };
      }
      
      return {
        Status: 'Error',
        Details: 'Invalid OTP'
      };
    } catch (error: any) {
      this.logger.error(`OTP verification error: ${error.message}`, error);
      return {
        Status: 'Error',
        Details: 'Verification failed due to system error'
      };
    }
  }
  
  /**
   * Generate random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  /**
   * Format phone number for Twilio
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Add + if not present
    if (!phoneNumber.startsWith('+')) {
      return `+${digitsOnly}`;
    }
    
    return phoneNumber;
  }
}