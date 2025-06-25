import {Container, Service } from 'typedi';
import { Logger } from 'winston';

interface OtpResponse {
  Status: 'Success' | 'Error';
  Details: string;
  code?: string;
}

@Service()
export class DummyOtpService {
  private otpStore: Map<string, string> = new Map();
  private logger: Logger = Container.get("logger");

  constructor() {}

  public async sendVerificationCode(phoneNumber: string): Promise<OtpResponse> {
    try {
      const otp = this.generateOTP();
      this.otpStore.set(phoneNumber, otp);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.info(`OTP sent to ${phoneNumber}: ${otp}`);

      return {
        Status: 'Success',
        Details: 'OTP sent successfully',
        code: otp // todo: in production, remove this line
      };
    } catch (error) {
      return {
        Status: 'Error',
        Details: 'Failed to send OTP'
      };
    }
  }

  public async verifyCode(phoneNumber: string, code: string): Promise<OtpResponse> {
    const storedOtp = this.otpStore.get(phoneNumber);

    if (!storedOtp) {
      return {
        Status: 'Error',
        Details: 'OTP expired or not found'
      };
    }

    if (storedOtp === code) {
      this.otpStore.delete(phoneNumber);
      return {
        Status: 'Success',
        Details: 'OTP verified successfully'
      };
    }

    return {
      Status: 'Error',
      Details: 'Invalid OTP'
    };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}