import { Container, Service } from "typedi";
import { Logger } from "winston";
import { IUserDto } from "@interfaces/user.interface";
import { UserModel } from "@models/user.model";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { UserRole } from "@enums/user-role.enum";
import { generateToken, verifyToken } from "@utils/jwt";
import { EmailService } from "./email.service";
// import { LuckySportsService } from "./lucky-sports.service";

@Service()
export class AuthService {
  private logger: Logger = Container.get("logger");
  private emailService: EmailService = Container.get(EmailService);

  public async register(userData: IUserDto): Promise<ServiceResponse> {
    try {
      this.logger.info("AuthService - Registering new user");

     
      const existingUserByPhone = await UserModel.findOne({
        phoneNumber: userData.phoneNumber,
      });
      if (existingUserByPhone) {
        return {
          success: false,
          message: "Phone number already registered",
          data: null,
        };
      }

       // Check if user already exists
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          message: "Email already registered",
          data: null,
        };
      }

      // Create new user
      const user = await UserModel.create({
        ...userData,
        role: userData.role || UserRole.USER,
      });
      console.log("user created", user)

      // try {
      // } catch (error) {
      //   console.error("Error creating member in LuckySports:", error);
      // }

      return {
        success: true,
        message: "User registered successfully",
        data: user,
      };
    } catch (error) {
      this.logger.error("Error in register:", error);
      return {
        success: false,
        message: "Failed to register user",
        data: null,
      };
    }
  }

  public async login(
    email: string,
    password: string
  ): Promise<ServiceResponse> {
    try {
      this.logger.info("AuthService - User login attempt");

      // Find user by email
      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        return {
          success: false,
          message: "Invalid credentials",
          data: null,
        };
      }

      // Verify password
      const isPasswordMatched = await user.comparePassword(password);

      if (!isPasswordMatched) {
        return {
          success: false,
          message: "Invalid credentials",
          data: null,
        };
      }

      return {
        success: true,
        message: "Login successful",
        data: user,
      };
    } catch (error) {
      this.logger.error("Error in login:", error);
      return {
        success: false,
        message: "Login failed",
        data: null,
      };
    }
  }

  public async sendVerificationEmail(
    userId: string,
    email: string
  ): Promise<ServiceResponse> {
    try {
      const token = generateToken({ userId }, "24h");
      const emailSent = await this.emailService.sendVerificationEmail(
        email,
        token
      );
      if (!emailSent) {
        return {
          success: false,
          message: "Failed to send verification email",
          data: null,
        };
      }

      return {
        success: true,
        message: "Verification email sent successfully",
        data: null,
      };
    } catch (error) {
      this.logger.error("Error sending verification email:", error);
      return {
        success: false,
        message: "Failed to send verification email",
        data: null,
      };
    }
  }
  public async verifyEmail(token: string): Promise<ServiceResponse> {
    try {
      const decoded = verifyToken(token);

      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        return {
          success: false,
          message: "Invalid verification token",
          data: null,
        };
      }

      user.emailVerified = true;
      await user.save();

      return {
        success: true,
        message: "Email verified successfully",
        data: user,
      };
    } catch (error) {
      this.logger.error("Error verifying email:", error);
      return {
        success: false,
        message: "Invalid or expired verification token",
        data: null,
      };
    }
  }
  public async forgotPassword(email: string): Promise<ServiceResponse> {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return {
          success: true, // Return success even if user not found (security)
          message:
            "If an account exists with this email, you will receive a password reset link",
          data: null,
        };
      }

      const token = generateToken({ userId: user._id }, "1h");
      const emailSent = await this.emailService.sendPasswordResetEmail(
        email,
        token
      );

      if (!emailSent) {
        return {
          success: false,
          message: "Failed to send password reset email",
          data: null,
        };
      }

      user.resetPasswordToken = token;
      user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      return {
        success: true,
        message: "Password reset email sent successfully",
        data: null,
      };
    } catch (error) {
      this.logger.error("Error in forgot password:", error);
      return {
        success: false,
        message: "Failed to process password reset request",
        data: null,
      };
    }
  }

  public async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ServiceResponse> {
    try {
      const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return {
          success: false,
          message: "Invalid or expired reset token",
          data: null,
        };
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return {
        success: true,
        message: "Password reset successful",
        data: null,
      };
    } catch (error) {
      this.logger.error("Error in reset password:", error);
      return {
        success: false,
        message: "Failed to reset password",
        data: null,
      };
    }
  }

  public async validateToken(userId: string): Promise<ServiceResponse> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
        };
      }

      if (!user.active) {
        return {
          success: false,
          message: "Account has been deactivated",
          data: null,
        };
      }

      return {
        success: true,
        message: "Token is valid",
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            phoneNumber: user.phoneNumber,
          },
        },
      };
    } catch (error) {
      this.logger.error("Error validating token:", error);
      return {
        success: false,
        message: "Failed to validate token",
        data: null,
      };
    }
  }

}
