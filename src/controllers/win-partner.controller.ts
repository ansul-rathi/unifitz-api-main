import { Container, Service } from "typedi";
import { Response, NextFunction } from "express";
import { IRequest } from "@interfaces/express.interface";
import HttpStatusCodes from "http-status-codes";
import ResponseModel from "@models/response.model";
import { WinPartnerService } from "@services/win-partner.service";
import { WalletService } from "@services/wallet.service";
import { UserModel } from "@models/user.model";

@Service()
export class WinPartnerController {
  private winPartnerService: WinPartnerService =
    Container.get(WinPartnerService);
  private walletService: WalletService = Container.get(WalletService);

  private;
  public async createPartner(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.winPartnerService.createPartner({
        ...req.body,
        createdBy: req.user.id,
      });

      if (result.success) {
        res
          .status(HttpStatusCodes.CREATED)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.CREATED,
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

  public async updatePartnerStatus(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { partnerId } = req.params;
      const { active } = req.body;

      const result = await this.winPartnerService.updatePartner(partnerId, {
        active,
      });

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

  public async createCustomer(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const partnerId = req.user.id;
      const result = await this.winPartnerService.createCustomer({
        ...req.body,
        partnerId,
      });

      if (result.success) {
        res
          .status(HttpStatusCodes.CREATED)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.CREATED,
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

  public async listCustomers(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const partnerId = req.user.id;
      const { page = 1, limit = 10, search } = req.query;

      const result = await this.winPartnerService.listCustomers({
        partnerId,
        page: Number(page),
        limit: Number(limit),
        search: search as string,
      });

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
  public async listCustomersAdmin(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {partnerId} = req.params;
      const { page = 1, limit = 10, search } = req.query;

      const result = await this.winPartnerService.listCustomers({
        partnerId,
        page: Number(page),
        limit: Number(limit),
        search: search as string,
      });

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
  public async getTransactionHistory(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.params.customerId;
      const partnerId = req.user.id;
      const user = await UserModel.findOne({ _id: userId, partnerId });

      if (!user) {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              "User not found"
            ).generate()
          );
        return;
      }
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        startDate,
        endDate,
        type,
        category,
        status,
      } = req.query;

      const result = await this.walletService.getTransactionsByUserId({
        userId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        category: category as string,
        type: type as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

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

  public async exportCustomerData(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const partnerId = req.user.id;
      const { startDate, endDate } = req.query;

      const result = await this.winPartnerService.exportCustomerData({
        partnerId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      if (result.success) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=customer-data.csv"
        );
        res.status(HttpStatusCodes.OK).send(result.data);
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

  public async depositToCustomer(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { customerId, amount } = req.body;
      const partnerId = req.user.id;

      const result = await this.winPartnerService.depositToCustomer({
        partnerId,
        customerId,
        amount,
        description: req.body.description || "Partner deposit",
      });

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

  public async getCustomerStats(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const partnerId = req.user.id;

      const result = await this.winPartnerService.getCustomerStats({
        partnerId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

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
}
