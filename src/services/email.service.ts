import { Container, Service } from "typedi";
import { Logger } from "winston";
import { Resend } from "resend";
import { emailConfig, FRONTEND_URL } from "@config/constants";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Service()
export class EmailService {
  private emailProvider: Resend;
  private logger: Logger;
  private defaultFromEmail: string;

  constructor() {
    this.logger = Container.get("logger");
    this.initializeEmailProvider();
    this.defaultFromEmail = `WinVibes <${emailConfig.fromAddress}>`;
  }

  private initializeEmailProvider() {
    this.emailProvider = new Resend(emailConfig.resendApiKey);
  }

  private async sendEmail({
    to,
    subject,
    html,
    from = this.defaultFromEmail,
  }: EmailOptions): Promise<boolean> {
    try {
      await this.emailProvider.emails.send({
        from,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      this.logger.error("Error sending email:", error);
      return false;
    }
  }

  public async sendVerificationEmail(
    to: string,
    token: string
  ): Promise<boolean> {
    const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;

    return this.sendEmail({
      to,
      subject: "Verify Your Email Address",
      html: `
        <h1>Welcome to WinVibes!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    token: string
  ): Promise<boolean> {
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    return this.sendEmail({
      to,
      subject: "Reset Your Password",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }
}
