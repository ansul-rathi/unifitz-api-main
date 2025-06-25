import HttpStatusCodes from "http-status-codes";
import { Service, Container } from "typedi";
import _ from "lodash";
import { Response, Request, NextFunction } from "express";
import { body, param } from "express-validator";
import { Logger } from "winston";

import ResponseModel from "@models/response.model";
import { UserRole } from "@enums/user-role.enum";

import { AuthService } from "@services/auth.service";
import { UserService } from "@services/user.service";
import { TwoFactorService } from "@services/two-factor.service";

import { sendToken } from "@utils/jwtToken";
import { sendErrorResponse } from "@utils/sendErrorResponse";
import { formatPhoneNumber } from "@utils/index";
import { IRequest } from "@interfaces/express.interface";
import { WalletService } from "@services/wallet.service";
import { LuckySportsService } from "@services/lucky-sports.service";

/**
 * Generates a random numeric string of the given length.
 */
function generateRandomNumber(length: number): string {
  let result = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

@Service()
export class AuthController {
  private logger: Logger = Container.get("logger");
  private authService: AuthService = Container.get(AuthService);
  private userService: UserService = Container.get(UserService);
  private walletService: WalletService = Container.get(WalletService);
  private luckySportsService: LuckySportsService =
    Container.get(LuckySportsService);

  private otpService: TwoFactorService = Container.get(TwoFactorService);

  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info("<Auth Controller>: login method : Processing");
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      if (result.success && result.data.active) {
        sendToken(result.data, HttpStatusCodes.OK, res);
      } else {
        sendErrorResponse(
          res,
          HttpStatusCodes.UNAUTHORIZED,
          !result?.data?.active
            ? "Account is disabled"
            : (result.message ?? "Invalid credentials")
        );
      }
    } catch (err) {
      this.logger.error("Auth Controller: login : Error", err);
      next(err);
    }
  }

  public async phoneLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info("<Auth Controller>: phoneLogin method : Processing");
    try {
      const { phoneNumber } = req.body;
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // First check if the user exists
      const user = await this.userService.showByPhoneRole(
        formattedPhone,
        UserRole.USER
      );

      if (!user) {
        sendErrorResponse(
          res,
          HttpStatusCodes.NOT_FOUND,
          "No account found with this phone number. Please register first."
        );
        return;
      }

      if (!user.active) {
        sendErrorResponse(
          res,
          HttpStatusCodes.UNAUTHORIZED,
          "Account is disabled"
        );
        return;
      }

      // Send OTP for login verification
      const result = await this.otpService.sendVerificationCode(formattedPhone);

      if (result.Status === "Success") {
        const response = new ResponseModel(
          { phoneNumber: formattedPhone, code: result.code },
          HttpStatusCodes.OK,
          "OTP sent successfully"
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        sendErrorResponse(
          res,
          HttpStatusCodes.BAD_REQUEST,
          result.Details || "Failed to send verification code"
        );
      }
    } catch (err) {
      this.logger.error("Auth Controller: phoneLogin : Error", err);
      next(err);
    }
  }

  public async verifyPhoneLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info("<Auth Controller>: verifyPhoneLogin method : Processing");
    try {
      const { phoneNumber, code } = req.body;
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Verify the OTP
      const verificationResult = await this.otpService.verifyCode(
        formattedPhone,
        code
      );

      if (verificationResult.Status !== "Success") {
        sendErrorResponse(
          res,
          HttpStatusCodes.BAD_REQUEST,
          "Invalid verification code"
        );
        return;
      }

      // Find the user with the verified phone number
      const user = await this.userService.showByPhoneRole(
        formattedPhone,
        UserRole.USER
      );

      if (!user) {
        sendErrorResponse(res, HttpStatusCodes.NOT_FOUND, "User not found");
        return;
      }

      // Login successful, send JWT token
      sendToken(user, HttpStatusCodes.OK, res);
    } catch (err) {
      this.logger.error("Auth Controller: verifyPhoneLogin : Error", err);
      next(err);
    }
  }

  public async verifyPhoneRegister(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info(
      "<Auth Controller>: verifyPhoneRegister method : Processing"
    );
    try {
      const { phoneNumber } = req.body;
      const { otp } = req.params;
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Verify the OTP first
      const verificationResult = await this.otpService.verifyCode(
        formattedPhone,
        otp
      );

      if (verificationResult.Status !== "Success") {
        sendErrorResponse(
          res,
          HttpStatusCodes.BAD_REQUEST,
          "Invalid verification code"
        );
        return;
      }
      const result = await this.userService.updateUserUsingPhone(
        formattedPhone,
        { phoneVerified: true }
      );

      if (!result.success) {
        sendErrorResponse(
          res,
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to create user"
        );
        return;
      }

      // Registration successful, send JWT token
      sendToken(result.data, HttpStatusCodes.CREATED, res);
    } catch (err) {
      this.logger.error("Auth Controller: verifyPhoneRegister : Error", err);
      next(err);
    }
  }

  public async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info("<Auth Controller>: register method : Processing");
    try {
      const { name, email, phoneNumber, password, referralCode } = req.body;

      const result = await this.authService.register({
        name,
        email: email.toLowerCase(),
        password,
        phoneNumber: formatPhoneNumber(phoneNumber),
        reference: "",
        role: UserRole.USER,
        signupComplete: true,
        emailVerified: true,
        phoneVerified: false,
        referralCode,
      });

      if (result.success) {
        await this.walletService.createWallet(result.data._id);
        await this.luckySportsService.createMember(result.data._id);
        // Send OTP for verification
        await this.otpService.sendVerificationCode(
          formatPhoneNumber(phoneNumber)
        );

        const response = new ResponseModel(
          result.data,
          HttpStatusCodes.CREATED,
          result.message
        );
        res.status(HttpStatusCodes.CREATED).json(response.generate());
      } else {
        sendErrorResponse(
          res,
          HttpStatusCodes.BAD_REQUEST,
          result.message ?? "Registration failed"
        );
      }
    } catch (err) {
      this.logger.error("Auth Controller: register : Error", err);
      next(err);
    }
  }

  public async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token } = req.params;
      const result = await this.authService.verifyEmail(token);

      if (result.success) {
        const response = new ResponseModel(
          result.data,
          HttpStatusCodes.OK,
          result.message
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        sendErrorResponse(res, HttpStatusCodes.BAD_REQUEST, result.message);
      }
    } catch (err) {
      next(err);
    }
  }
  public async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);
      const response = new ResponseModel(
        null,
        HttpStatusCodes.OK,
        result.message
      );
      res.status(HttpStatusCodes.OK).json(response.generate());
    } catch (err) {
      next(err);
    }
  }
  public async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const result = await this.authService.resetPassword(token, password);

      if (result.success) {
        const response = new ResponseModel(
          null,
          HttpStatusCodes.OK,
          result.message
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        sendErrorResponse(res, HttpStatusCodes.BAD_REQUEST, result.message);
      }
    } catch (err) {
      next(err);
    }
  }

  public async validateToken(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.authService.validateToken(req.user.id);

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        sendErrorResponse(res, HttpStatusCodes.UNAUTHORIZED, result.message);
      }
    } catch (err) {
      this.logger.error("Error validating token:", err);
      next(err);
    }
  }

  public async updatePhone(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info("<Auth Controller>: updatePhone method : Processing");
    try {
      const { phoneNumber } = req.body;
      const userId = req.user.id;
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Check if phone number is already used by another user
      const existingUser =
        await this.userService.show({phoneNumber: formattedPhone, phoneVerified: true});

      if (existingUser && existingUser._id.toString() !== userId) {
        sendErrorResponse(
          res,
          HttpStatusCodes.CONFLICT,
          "Phone number is already registered with another account"
        );
        return;
      }

      // Send OTP for verification
      const result = await this.otpService.sendVerificationCode(formattedPhone);

      if (result.Status === "Success") {
        // Store the new phone number temporarily
        // We'll update it permanently after OTP verification
        const updateResult = await this.userService.updateUser(userId, {
          pendingPhoneNumber: formattedPhone,
        });

        if (!updateResult.success) {
          sendErrorResponse(
            res,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            "Failed to update phone number"
          );
          return;
        }

        const response = new ResponseModel(
          { phoneNumber: formattedPhone, code: result.code },
          HttpStatusCodes.OK,
          "OTP sent successfully"
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        sendErrorResponse(
          res,
          HttpStatusCodes.BAD_REQUEST,
          "Failed to send verification code"
        );
      }
    } catch (err) {
      this.logger.error("Auth Controller: updatePhone : Error", err);
      next(err);
    }
  }

  public async verifyPhoneUpdate(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info(
      "<Auth Controller>: verifyPhoneUpdate method : Processing"
    );
    try {
      const { otp } = req.params;
      const userId = req.user.id;

      // Get the user to find the pending phone number
      const userResponse = await this.userService.getUserById(userId);

      if (!userResponse.success || !userResponse.data.pendingPhoneNumber) {
        sendErrorResponse(
          res,
          HttpStatusCodes.BAD_REQUEST,
          "No pending phone number update found"
        );
        return;
      }

      const pendingPhoneNumber = formatPhoneNumber(
        userResponse.data.pendingPhoneNumber
      );

      // Verify the OTP first
      const verificationResult = await this.otpService.verifyCode(
        pendingPhoneNumber,
        otp
      );

      if (verificationResult.Status !== "Success") {
        sendErrorResponse(
          res,
          HttpStatusCodes.BAD_REQUEST,
          "Invalid verification code"
        );
        return;
      }

      // Check if phone number is already used by another user
      const existingUser = await this.userService.show({
        phoneNumber: pendingPhoneNumber,
        phoneVerified: false,
      });
      console.log("existingUser", existingUser)

      if (existingUser) {
        await this.userService.updateUser(existingUser._id, {
          phoneNumber: generateRandomNumber(10),
          phoneVerified: false
        })
      }

      // Update the phone number permanently
      const result = await this.userService.updateUser(userId, {
        phoneNumber: pendingPhoneNumber,
        phoneVerified: true,
        pendingPhoneNumber: undefined, // Clear the pending phone
      });

      if (!result.success) {
        sendErrorResponse(
          res,
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
          "Failed to update phone number"
        );
        return;
      }

      const response = new ResponseModel(
        result.data,
        HttpStatusCodes.OK,
        "Phone number updated successfully"
      );
      res.status(HttpStatusCodes.OK).json(response.generate());
    } catch (err) {
      this.logger.error("Auth Controller: verifyPhoneUpdate : Error", err);
      next(err);
    }
  }

  public validate(method: string): any {
    switch (method) {
      case "login":
        return [
          body("email", "Email is required").not().isEmpty(),
          body("password", "Password is required").not().isEmpty(),
        ];
      case "register":
        return [
          body("name", "Please Enter Your Name").not().isEmpty(),
          body("email", "Please enter a valid email").isEmail(),
          body("password", "Password is required").not().isEmpty(),
        ];
      case "phoneLogin":
        return [
          body("phoneNumber", "Phone number is required")
            .not()
            .isEmpty()
            .matches(/^\+?[0-9]{10,15}$/)
            .withMessage("Please enter a valid phone number"),
        ];
      case "updatePhone":
        return [
          body("phoneNumber", "Phone number is required")
            .not()
            .isEmpty()
            .matches(/^\+?[0-9]{10,15}$/)
            .withMessage("Please enter a valid phone number"),
        ];
      case "verifyPhoneUpdate":
        return [
          param("otp", "Verification code is required")
            .not()
            .isEmpty()
            .isLength({ min: 4, max: 8 })
            .withMessage("Code must be between 4 and 8 characters"),
        ];
      case "phoneRegister":
        return [
          body("phoneNumber", "Phone number is required")
            .not()
            .isEmpty()
            .matches(/^\+?[0-9]{10,15}$/)
            .withMessage("Please enter a valid phone number"),
          body("name", "Name is required").not().isEmpty(),
        ];
      case "verifyPhoneLogin":
        return [
          body("phoneNumber", "Phone number is required").not().isEmpty(),
          body("code", "Verification code is required")
            .not()
            .isEmpty()
            .isLength({ min: 4, max: 8 })
            .withMessage("Code must be between 4 and 8 characters"),
        ];
      case "verifyPhoneRegister":
        return [
          body("phoneNumber", "Phone number is required").not().isEmpty(),
          param("otp", "Verification code is required")
            .not()
            .isEmpty()
            .isLength({ min: 4, max: 8 })
            .withMessage("Code must be between 4 and 8 characters"),
        ];
      case "sendotp":
        return [
          body("phoneNumber").exists().withMessage("Phone number is required"),
        ];
      case "verifyotp":
        return [
          body("phoneNumber").exists().withMessage("Phone number is required"),
          body("code").exists().withMessage("code is required"),
          body("role").exists().withMessage("role is required"),
        ];

      case "forgotPassword":
        return [
          body("email")
            .exists()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid email address"),
        ];

      case "resetPassword":
        return [
          body("password")
            .exists()
            .withMessage("Password is required")
            .isString()
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters")
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
            .withMessage(
              "Password must include lowercase, uppercase, number, and special character"
            ),
        ];

      case "validate":
        return [];

      default:
        return [];
    }
  }
}
