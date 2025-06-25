import { Container, Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import { LuckySportsService } from "@services/lucky-sports.service";
import HttpStatusCodes from "http-status-codes";
import ResponseModel from "@models/response.model";
import { IRequest } from "@interfaces/express.interface";
import { LUCKY_SPORTS_JWT } from "@config/constants";
import { UserRole } from "@enums/user-role.enum";

@Service()
export class LuckySportsController {
  private luckySportsService: LuckySportsService =
    Container.get(LuckySportsService);

  public async getIDToken(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.luckySportsService.getIDToken();
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

  public async getGuestToken(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.luckySportsService.getGuestToken();
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }


  public async createMember(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      const { playerId } = req.body;
      const result = await this.luckySportsService.createMember(
        playerId,
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


  public async loginMember(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { playerId } = req.body;
      const result = await this.luckySportsService.loginMember(playerId);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }
  public async listTrades(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.query;
      const userRole = req.user?.role;
      if (userRole === UserRole.USER){
        params.player_ids = req.user.id
      }
      const result = await this.luckySportsService.listTrades(params);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  
  // checked
  public async placeSportsbookBet(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.luckySportsService.placeSportsbookBet(req.body);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result.data);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  // checked
  public async placeExchangeBet(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.luckySportsService.placeExchangeBet(req.body);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result.data);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }


  // Settlement methods
  // checked
  public async settleSportsbookWin(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.luckySportsService.settleSportsbookWin(req.body);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result.data);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  // checked
  public async settleSportsbookLoss(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.luckySportsService.settleSportsbookLoss(req.body);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result.data);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  public async rollbackBet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.luckySportsService.rollbackBet(req.body);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result.data);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          code: 400,
          message: result.message,
          responseData: null
        });
      }
    } catch (error) {
      next(error);
    }
  }
  public async processBonusPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.luckySportsService.processBonusPayout(req.body);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result.data);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          code: 400,
          message: result.message,
          responseData: null
        });
      }
    } catch (error) {
      next(error);
    }
  }
  public async test(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(HttpStatusCodes.OK).json({
        code: 200,
        message: "Success",
        responseData: null
      });
    } catch (error) {
      next(error);
    }
  }

  // Balance and bonus methods
  // checked
  public async settleExchangeBet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.luckySportsService.settleExchangeBet(req.body);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result.data);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          code: 400,
          message: result.message,
          responseData: null
        });
      }
    } catch (error) {
      next(error);
    }
  }


  // checked
  public async getBalance(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const token = req?.query?.token
      if (!token){
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Token is required").generate());
        return
      }
      if (token !== LUCKY_SPORTS_JWT){
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Invalid token").generate());
        return
      }
      const userId = req?.query?.user_id
      if (!userId){
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "User ID is required").generate());
        return
      }
      const result = await this.luckySportsService.getBalance(userId as string);
      if (result.success) {
        res.status(HttpStatusCodes.OK).json({
          balance: result.data?.balance
        });
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

}
