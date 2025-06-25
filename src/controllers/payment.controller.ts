import { Request, Response, NextFunction } from "express";
import { Service, Container } from "typedi";
import { Logger } from "winston";
import { UnifiedPaymentService } from "../services/payment.service";
import { PaymentProvider } from "../interfaces/payment.interface";
import { IRequest } from "@interfaces/express.interface";
import { body, param } from "express-validator";
import { TicketService } from "@services/ticket.service";
import { WalletService } from "@services/wallet.service";
import HttpStatusCodes from "http-status-codes";

@Service()
export class PaymentController {
  private logger: Logger = Container.get("logger");
  private paymentService: UnifiedPaymentService = Container.get(
    UnifiedPaymentService
  );
  private ticketService: TicketService = Container.get(TicketService);
  private walletService: WalletService = Container.get(WalletService);

  /**
   * Create a deposit payment
   */
  public async createDeposit(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        amount,
        paymentProvider,
        paymentMethod,
        currency,
        customerName,
        customerEmail,
        customerPhone,
        metadata,
      } = req.body;

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: User ID is required",
          data: null,
        });
        return;
      }

      const result = await this.paymentService.createDeposit({
        userId,
        amount,
        paymentProvider,
        paymentMethod,
        currency,
        customerName,
        customerEmail,
        customerPhone,
        metadata,
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error("Error creating deposit:", error);
      res.status(500).json({
        success: false,
        message: error.message || "An error occurred while creating deposit",
        data: null,
      });
      next(error);
    }
  }

  /**
   * Create a withdrawal request
   */
  public async createWithdrawal(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        paymentProvider,
        amount,
        userId,
        bankCode,
        accountHolderName,
        accountNumber,
        ifscCode,
        currency,
        email,
        phone,
        ticketId = "",
        metadata,
      } = req.body;

     
      const result = await this.paymentService.createWithdrawal({
        userId,
        amount,
        paymentProvider,
        bankCode,
        accountHolderName,
        accountNumber,
        ifscCode,
        currency,
        email,
        phone,
        ticketId,
        metadata,
      });
      console.log({ result });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error("Error creating withdrawal:", error);
      res.status(500).json({
        success: false,
        message: error.message || "An error occurred while creating withdrawal",
        data: null,
      });
      next(error);
    }
  }

  /**
   * Process HZPays payment callback
   */
  public async handleHZPaysCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.logger.info("HZPays payment callback received:", req.body);

      const result = await this.paymentService.processHZPaysNotification(
        req.body
      );

      // HZPays expects a specific response format
      if (result.success) {
        res.status(200).send("success");
      } else {
        res.status(200).send("fail");
      }
    } catch (error: any) {
      this.logger.error("Payment callback error:", error);
      res.status(200).send("fail");
      next(error);
    }
  }

  /**
   * Process HZPays payout callback
   */
  public async handleHZPaysPayoutCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.logger.info("HZPays payout callback received:", req.body);

      const result = await this.paymentService.processHZPaysPayoutNotification(
        req.body
      );

      if (result.success) {
        const ticketId = result.data?.transaction?.metadata?.ticketId;
        if (!ticketId) {
          res.status(HttpStatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Ticket ID not found in metadata",
          });
          return;
        }
        const ticket = await this.ticketService.getTicket(ticketId);
        // Update the ticket status and add a conversation entry
        await this.ticketService.updateTicket(ticketId, {
          status: "CLOSED",
          resolution: {
            comment: "Withdrawal processed successfully",
            resolvedAt: new Date(),
          },
        });
        await this.ticketService.addConversation(ticketId, {
          message: "Withdrawal processed successfully",
          sender: ticket.data.assignedTo,
          attachment: null,
        });

        res
          .status(HttpStatusCodes.OK)
          .json({ success: true, message: "Callback processed successfully" });
      } else {
        // Revert hold balance if withdrawal fails
        await this.walletService.releaseHold({
          holdId: result.data.holdLedgerTransactionId,
          reason: "Withdrawal failed",
        });

        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ success: false, message: result.message });
      }
    } catch (error: any) {
      this.logger.error("Error processing HZPays payout callback:", error);
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Internal server error" });
      next(error);
    }
  }

  /**
   * Process BSD Payment callback
   */
  public async handleBSDPaymentCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      this.logger.info("BSD Payment callback received:", req.body);

      const result = await this.paymentService.processBSDPaymentNotification(
        req.headers,
        req.body
      );

      // BSD Payment expects a specific response format
      if (result.success) {
        res.status(200).send("success");
      } else {
        res.status(200).send("fail");
      }
    } catch (error: any) {
      this.logger.error("BSD Payment callback error:", error);
      res.status(200).send("fail");
      next(error); // Added next(error) to pass the error to the next middleware
    }
  }

  /**
   * Check payment status
   */
  public async checkPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reference } = req.params;
      const { payerId } = req.query;

      const result = await this.paymentService.checkPaymentStatus(
        reference,
        payerId ? payerId.toString() : undefined
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error("Error checking payment status:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while checking payment status",
        data: null,
      });
      next(error);
    }
  }
  /**
   * Check payment status
   */
  public async checkBSDPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reference } = req.params;

      const result = await this.paymentService.checkBSDPaymentStatus(
        reference,
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error("Error checking payment status:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while checking payment status",
        data: null,
      });
      next(error);
    }
  }

  /**
   * Submit payment proof (UTR)
   */
  public async submitPaymentProof(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reference } = req.params;
      const { proof, payerId } = req.body;

      if (!proof || !payerId) {
        res.status(400).json({
          success: false,
          message: "Proof and payerId are required",
          data: null,
        });
        return;
      }

      const result = await this.paymentService.submitPaymentProof(
        reference,
        proof,
        payerId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error("Error submitting payment proof:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while submitting payment proof",
        data: null,
      });
      next(error);
    }
  }

  /**
   * Query UPI status
   */
  public async queryUpi(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { upi } = req.query;

      if (!upi) {
        res.status(400).json({
          success: false,
          message: "UPI ID is required",
          data: null,
        });
        return;
      }

      const result = await this.paymentService.queryUpi(upi.toString());

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error("Error querying UPI status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "An error occurred while querying UPI status",
        data: null,
      });
      next(error);
    }
  }

  /**
   * Query account balance
   */
  public async queryAccountBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { provider } = req.params;
      console.log("reached here: ", provider);

      const result = await this.paymentService.queryAccountBalance(
        provider as PaymentProvider
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      this.logger.error("Error querying account balance:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "An error occurred while querying account balance",
        data: null,
      });
      next(error); // Added next(error) to pass the error to the next middleware
    }
  }

  public validate(method: string) {
    
    switch (method) {
      case "queryBalance":
        return [
          param("provider")
            .exists()
            .withMessage("Provider is required")
            .isIn(Object.values(PaymentProvider))
            .withMessage("Invalid provider"),
        ];

        case 'createWithdrawal': 
        return [
          body("amount")
            .exists()
            .withMessage("Amount is required")
            .isNumeric()
            .withMessage("Amount must be a number"),
          body("paymentProvider")
            .exists()
            .withMessage("Payment provider is required")
            .isIn(Object.values(PaymentProvider))
            .withMessage("Invalid payment provider"),
          body("userId")
            .exists()
            .withMessage("User ID is required")
            .isMongoId()
            .withMessage("Invalid User ID"),
        ]
      default:
        return [];
    }
  }
}
