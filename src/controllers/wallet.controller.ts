import { Service, Container } from "typedi";
import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "http-status-codes";

import { WalletService } from "../services/wallet.service";
import { IRequest } from "@interfaces/express.interface";
import ResponseModel from "@models/response.model";
import { query } from "express-validator";
import { TransactionCoordinatorService } from "@services/transaction-coordinator.service";

@Service()
export class WalletController {
  private walletService: WalletService = Container.get(WalletService);
  private transactionCoordinator: TransactionCoordinatorService = Container.get(TransactionCoordinatorService);

  public async getMyBalance(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req?.user?.id;

      const result = await this.walletService.getBalanceByUserId(userId);
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
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }
  public async getBalance(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req?.query;

      const result = await this.walletService.getBalanceByUserId(
        userId as string
      );
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
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }

  public async staffDeposit(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, amount,description, ticketId, ticketResolution, paymentTxnId } = req.body;
      const staffId = req?.user.id; 

      const result = await this.transactionCoordinator.processStaffDeposit({
        userId,
        amount,
        description,
        paymentTxnId,
        staffId,
        ticketId,
        ticketResolution
      });

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }
  public async adminDeposit(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, amount,description, ticketId, ticketResolution, paymentTxnId } = req.body;
      const staffId = req?.user.id; 

      const result = await this.transactionCoordinator.processAdminDeposit({
        userId,
        amount,
        description,
        paymentTxnId,
        staffId,
        ticketId,
        ticketResolution
      });

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }


  public async staffWithdraw(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, amount, description, ticketId, ticketResolution,paymentTxnId,holdLedgerTransactionId  } = req.body;
      const staffId = req.user.id;

      const result = await this.transactionCoordinator.processStaffWithdrawal({
        userId,
        amount,
        description,
        staffId,
        ticketId,
        ticketResolution,
        paymentTxnId,
        holdLedgerTransactionId,
      });

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }
  public async adminWithdraw(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, amount, description, ticketId, ticketResolution,paymentTxnId,holdLedgerTransactionId  } = req.body;
      const staffId = req.user.id;

      const result = await this.transactionCoordinator.processAdminWithdrawal({
        userId,
        amount,
        description,
        staffId,
        ticketId,
        ticketResolution,
        paymentTxnId,
        holdLedgerTransactionId,
      });

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { startDate, endDate, category, type, page, limit } = req.query;

      const result = await this.walletService.getTransactionsByUserId({
        userId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        category: category as string,
        type: type as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      res.status(HttpStatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
  public async getMyTransactions(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const { startDate, endDate, category, type, page, limit } = req.query;

      const result = await this.walletService.getTransactionsByUserId({
        userId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        category: category as string,
        type: type as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      res.status(HttpStatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public validate(method: string): any {
    switch (method) {
      case "staffDeposit":
        return [];
      case "staffWithdraw":
        return [];
      case "getTransactions":
        return [];

      case "getBalance":
        return [
          query("userId")
            .exists()
            .isString()
            .withMessage("User ID is required"),
        ];

      default:
        return [];
    }
  }
}
