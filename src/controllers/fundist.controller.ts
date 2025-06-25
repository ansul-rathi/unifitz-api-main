import { Container, Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import { FundistOneWalletService } from "@services/fundist-onewallet.service";
import HttpStatusCodes from "http-status-codes";
import { FundistService } from "@services/fundist.service";
import { IRequest } from "@interfaces/express.interface";
import crypto from "crypto";
import {
  GameSortingType,
  IFundistAddUserRequest,
} from "@interfaces/fundist.interface";
import { UserModel } from "@models/user.model";
import ResponseModel from "@models/response.model";
import { FundistRestrictedCountryService } from "@services/fundist-restricted-country.service";
import { UserRole } from "@enums/user-role.enum";

@Service()
export class FundistController {
  private fundistOneWalletService: FundistOneWalletService = Container.get(
    FundistOneWalletService
  );
  private restrictedCountryService: FundistRestrictedCountryService =
    Container.get(FundistRestrictedCountryService);

  private fundistService: FundistService = Container.get(FundistService);
  private passwordSecret: string = "35B1EA";
  public async handleFundistOneWallet(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.fundistOneWalletService.handleRequest(req.body);
      if (result.status === "OK") {
        res.status(HttpStatusCodes.OK).json(result);
      } else {
        res
          .status(HttpStatusCodes.OK)
          .json(
            this.fundistOneWalletService.formatResponse(
              false,
              result,
              result.error
            )
          );
      }
    } catch (error) {
      next(error);
    }
  }

  public async getAllGames(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.fundistService.getGameFullList();
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          this.fundistOneWalletService.formatResponse(
            false,
            {
              status: "ERROR",
              error: result.message,
            },
            result.message
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
  public async getGames(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.fundistService.getGames();
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          this.fundistOneWalletService.formatResponse(
            false,
            {
              status: "ERROR",
              error: result.message,
            },
            result.message
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
  public async getCategories(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.fundistService.getCategories();
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          this.fundistOneWalletService.formatResponse(
            false,
            {
              status: "ERROR",
              error: result.message,
            },
            result.message
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
  public async demoLaunchGame(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.fundistService.launchGame({
        system: "998",
        page: "crazytime:CrazyTime0000001",
        userIp: "192.168.1.1",
        login: "$DemoUser$",
        demo: "1",
        password: "Demo",
        currency: "INR",
      });
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          this.fundistOneWalletService.formatResponse(
            false,
            {
              status: "ERROR",
              error: result.message,
            },
            result.message
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async getSortedGames(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { type } = req.query;

      if (
        !type ||
        !Object.values(GameSortingType).includes(type as GameSortingType)
      ) {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              "Valid type (new/popular) is required"
            ).generate()
          );
        return;
      }

      const result = await this.fundistService.getSortedGames({
        type: type as GameSortingType,
      });

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result);
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
  public async launchGame(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { system, page, userIp } = req.query;
      const userId = req.user.id;
      if (!system || !page) {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              "System and Page is required"
            ).generate()
          );
      }
      // const clientIp = getClientIp(req as any);
      // const ip = req.ip;
      // const ips = req.ips;
      // const ipss = req.headers["x-real-ip"] || req.connection.remoteAddress;
      const result = await this.fundistService.launchGame({
        system: system as string,
        page: page as string,
        userIp: userIp as string,
        login: userId,
        password: this.generatePassword(userId),
        currency: "INR",
        // autoCreate: true,
      });
      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          this.fundistOneWalletService.formatResponse(
            false,
            {
              status: "ERROR",
              error: result.message,
            },
            result.message
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }

  private generatePassword(id: string): string {
    const hash = crypto.createHash("sha256");
    hash.update(`${this.passwordSecret}:${id}`);
    return hash.digest("hex").slice(0, 12); // Returns a 12-character password
  }

  public async auth(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const userIP = req.query.userIp;
      if (!userIP) {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              "userIp query is required"
            ).generate()
          );
      }
      const result = await this.fundistService.addUser({
        login: userId,
        password: this.generatePassword(userId),
        currency: "INR",
        language: "en",
        registrationIP: userIP, //pras
        // registrationIP: "103.175.9.47", //ansu
      } as IFundistAddUserRequest);
      if (result.success) {
        await UserModel.updateOne(
          { _id: userId },
          {
            $set: {
              fundist: true,
            },
          }
        );
        res.status(HttpStatusCodes.OK).json(result);
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          this.fundistOneWalletService.formatResponse(
            false,
            {
              status: "ERROR",
              error: result.message,
            },
            result.message
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async getLobbyState(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tables } = req.query;

      if (!tables) {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              "Tables parameter is required"
            ).generate()
          );
        return;
      }

      let tablesList: string[];
      try {
        tablesList = Array.isArray(tables)
          ? tables
          : JSON.parse(tables as string);
      } catch (e) {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              "Invalid tables format"
            ).generate()
          );
        return;
      }

      const result = await this.fundistService.getLobbyState({
        tables: tablesList,
      });

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(result);
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

  // restricted country controller
  public async getRestrictedCountries(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result =
        await this.restrictedCountryService.getRestrictedCountries();

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

  public async checkCountryRestriction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { merchantId, countryCode, subdivisionCode } = req.query;

      if (!merchantId || !countryCode) {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              "Merchant ID and country code are required"
            ).generate()
          );
        return;
      }

      const result = await this.restrictedCountryService.isCountryRestricted({
        merchantId: merchantId as string,
        countryCode: countryCode as string,
        subdivisionCode: subdivisionCode as string,
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

    /**
   * Sync games from Fundist to our database
   * @route POST /api/casino/games/sync
   */
    public async syncGames(_req: Request, res: Response, next: NextFunction) {
      try {
        const result = await this.fundistService.syncGames();
        return res
          .status(result.success ? 200 : 400)
          .json(
            new ResponseModel(
              result,
              HttpStatusCodes.OK,
              "Games synced successfully"
            ).generate()
          );
      } catch (error) {
        next(error);
      }
    }
  
    /**
     * Get casino transactions with game details
     * @route GET /api/casino/transactions
     */
    public async getCasinoTransactions(
      req: IRequest,
      res: Response,
      next: NextFunction
    ) {
      try {
        const {
          startDate,
          endDate,
          limit = "50",
          page = "0",
          status = "COMPLETED",
        } = req.query;
        
        let userId = req.query.userId as string;
        if (req.user.role === UserRole.USER){
          userId = req.user.id;
        }
  
        // Parse dates and pagination parameters
        const options: any = {
          limit: parseInt(limit as string, 10),
          page: parseInt(page as string, 10),
          status: status as string,
        };
  
        if (startDate) {
          options.startDate = new Date(startDate as string);
        }
  
        if (endDate) {
          options.endDate = new Date(endDate as string);
        }
  
        if (userId) {
          options.userId = userId as string;
        }
  
        const result =
          await this.fundistService.getCasinoTransactions(options);
  
        return res
          .status(result.success ? 200 : 400)
          .json(new ResponseModel(
            result,
            HttpStatusCodes.OK,
            "Transactions fetched successfully"
          ).generate());
      } catch (error) {
        next(error);
      }
    }
}
