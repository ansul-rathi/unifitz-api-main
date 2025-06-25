import { Router } from "express";
import { PaymentController } from "@controllers/payment.controller";
import Container from "typedi";
import authorize from "@middlewares/auth";
import { StaffRole } from "@enums/user-role.enum";
import { validationHandler } from "@middlewares/errorHandler";

export class PaymentRoute {
  private api: Router = Router();
  private readonly paymentController: PaymentController =
    Container.get(PaymentController);

  public getApi(): Router {
    // Public routes for payment provider callbacks (no authentication needed)
    this.api.post(
      "/hzpays/callback",
      this.paymentController.handleHZPaysCallback.bind(this.paymentController)
    );

    this.api.post(
      "/hzpays/payout-callback",
      this.paymentController.handleHZPaysPayoutCallback.bind(
        this.paymentController
      )
    );

    this.api.post(
      "/bsdpay/callback",
      this.paymentController.handleBSDPaymentCallback.bind(
        this.paymentController
      )
    );

    // User deposit/withdrawal routes (requires user authentication)
    this.api.post(
      "/deposit",
      authorize(),
      this.paymentController.createDeposit.bind(this.paymentController)
    );

    this.api.post(
      "/withdrawal",
      authorize([StaffRole.ADMIN]),
      this.paymentController.validate("createWithdrawal"),
      validationHandler(),
      this.paymentController.createWithdrawal.bind(this.paymentController)
    );

    // Payment status and operations
    this.api.get(
      "/status/:reference",
      authorize(),
      this.paymentController.checkPaymentStatus.bind(this.paymentController)
    );
    this.api.get(
      "/bsdpay/status/:reference",
      authorize(),
      this.paymentController.checkBSDPaymentStatus.bind(this.paymentController)
    );

    this.api.post(
      "/proof/:reference",
      authorize(),
      this.paymentController.submitPaymentProof.bind(this.paymentController)
    );

    // UPI query (could be public or authenticated)
    this.api.get(
      "/upi/query",
      authorize(),
      this.paymentController.queryUpi.bind(this.paymentController)
    );

    // Administrator routes
    this.api.get(
      "/balance/:provider",
      this.paymentController.validate("queryBalance"),
      validationHandler(),
      authorize([StaffRole.ADMIN]),
      this.paymentController.queryAccountBalance.bind(this.paymentController)
    );

    // Optional: Public route for payment status check
    // This allows checking status without authentication (useful for redirect pages)
    this.api.get(
      "/public-status/:reference",
      this.paymentController.checkPaymentStatus.bind(this.paymentController)
    );

    return this.api;
  }
}
