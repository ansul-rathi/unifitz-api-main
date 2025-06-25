import { Service, Container } from "typedi";
import { Response, Request, NextFunction } from "express";
import { body } from "express-validator";
import { Logger } from "winston";
import HttpStatusCodes from "http-status-codes";
import { InplayService } from "@services/inplay.service";
import ResponseModel from "@models/response.model";

@Service()
export class InplayController {
  private logger: Logger = Container.get("logger");
  private inplayService: InplayService = Container.get(InplayService);

  public async getInplayData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Inplay Controller>: getInplayData method : Processing");
    try {
      const result = await this.inplayService.fetchInplayEvents();
      
      const response = new ResponseModel(
        result,
        HttpStatusCodes.OK,
        "Inplay events retrieved successfully"
      );
      res.status(HttpStatusCodes.OK).json(response.generate());
    } catch (err) {
      this.logger.error("Inplay Controller: getInplayData : Error", err);
      next(err);
    }
  }

  public async placeInplayBet(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Inplay Controller>: placeInplayBet method : Processing");
    try {
      const betData = req.body;
      const result = await this.inplayService.placeBet(betData);

      if (result.success) {
        const response = new ResponseModel(
          result.data,
          HttpStatusCodes.CREATED,
          "Inplay bet placed successfully"
        );
        res.status(HttpStatusCodes.CREATED).json(response.generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (err) {
      this.logger.error("Inplay Controller: placeInplayBet : Error", err);
      next(err);
    }
  }

  public async getInplayOdds(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Inplay Controller>: getInplayOdds method : Processing");
    try {
      const { eventId } = req.params;
      const result = await this.inplayService.fetchOdds(eventId);

      const response = new ResponseModel(
        result,
        HttpStatusCodes.OK,
        "Inplay odds retrieved successfully"
      );
      res.status(HttpStatusCodes.OK).json(response.generate());
    } catch (err) {
      this.logger.error("Inplay Controller: getInplayOdds : Error", err);
      next(err);
    }
  }

  // public async getInplayStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   this.logger.info("<Inplay Controller>: getInplayStats method : Processing");
  //   try {
  //     const { eventId } = req.params;
  //     const result = await this.inplayService.fetchStats(eventId);

  //     if (result.success) {
  //       const response = new ResponseModel(
  //         result.data,
  //         HttpStatusCodes.OK,
  //         "Inplay stats retrieved successfully"
  //       );
  //       res.status(HttpStatusCodes.OK).json(response.generate());
  //     } else {
  //       res.status(HttpStatusCodes.BAD_REQUEST).json(
  //         new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
  //       );
  //     }
  //   } catch (err) {
  //     this.logger.error("Inplay Controller: getInplayStats : Error", err);
  //     next(err);
  //   }
  // }

  public validate(method: string): any[] {
    switch (method) {
      case "getInplayEvents":
        return [];
      case "placeInplayBet":
        return [
          body("eventId").exists().isString().withMessage("Event ID is required"),
          body("selectionId").exists().isString().withMessage("Selection ID is required"),
          body("stake").exists().isNumeric().withMessage("Valid stake amount is required"),
          body("odds").exists().isNumeric().withMessage("Valid odds are required")
        ];
      case "getInplayOdds":
        return [
          body("eventId").exists().isString().withMessage("Event ID is required")
        ];
      // case "getInplayStats":
      //   return [
      //     body("eventId").exists().isString().withMessage("Event ID is required")
      //   ];
        
      default:
        return [];
    }
  }
}