import { Router } from "express";
import { Container } from "typedi";
import { validationHandler } from "@middlewares/errorHandler";
import { AuthController } from "@controllers/auth.controller";
import authorize from "@middlewares/auth";

export class AuthRoute {
  private api: Router = Router();

  private readonly authController: AuthController =
    Container.get(AuthController);
  constructor() {
    this.authController = new AuthController();
    this.routes();
  }
  public getApi(): Router {
    return this.api;
  }

  private routes(): void {
    this.api.post(
      "/login",
      this.authController.validate("login"),
      validationHandler(),
      this.authController.login.bind(this.authController)
    );

    this.api.post(
      "/phone-login",
      this.authController.validate("phoneLogin"),
      validationHandler(),
      this.authController.phoneLogin.bind(this.authController)
    );
    this.api.post(
      "/verify-phone-login",
      this.authController.validate("verifyPhoneLogin"),
      validationHandler(),
      this.authController.verifyPhoneLogin.bind(this.authController)
    );

    this.api.post(
      "/register",
      this.authController.validate("register"),
      validationHandler(),
      this.authController.register.bind(this.authController)
    );
    this.api.post(
      "/update-phone",
      authorize(),
      this.authController.validate("updatePhone"),
      validationHandler(),
      this.authController.updatePhone.bind(this.authController)
    );

    this.api.post(
      "/verify-phone-update/:otp",
      authorize(),
      this.authController.validate("verifyPhoneUpdate"),
      validationHandler(),
      this.authController.verifyPhoneUpdate.bind(this.authController)
    );

    this.api.post(
      "/verify-phone/:otp",
      this.authController.validate("verifyPhoneRegister"),
      validationHandler(),
      this.authController.verifyPhoneRegister.bind(this.authController)
    );

    this.api.get(
      "/verify-email/:token",
      this.authController.verifyEmail.bind(this.authController)
    );

    this.api.post(
      "/forgot-password",
      this.authController.validate("forgotPassword"),
      validationHandler(),
      this.authController.forgotPassword.bind(this.authController)
    );

    this.api.post(
      "/reset-password/:token",
      this.authController.resetPassword.bind(this.authController)
    );

    this.api.get(
      "/validate",
      authorize(),
      this.authController.validate("validate"),
      validationHandler(),
      this.authController.validateToken.bind(this.authController)
    );

  }
}
