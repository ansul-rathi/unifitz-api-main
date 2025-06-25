import { Service, Container } from "typedi";
import { Response, Request, NextFunction } from "express";
import { body } from "express-validator";
import { Logger } from "winston";
import HttpStatusCodes from "http-status-codes";
import { SportsService } from "@services/sports.service";
import ResponseModel from "@models/response.model";

@Service()
export class SportsController {
  private logger: Logger = Container.get("logger");
  private sportsService: SportsService = Container.get(SportsService);

  public async getSportsList(_req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Sports Controller>: getSportsList method : Processing");
    try {
      const result = await this.sportsService.fetchSports();
      
      const response = new ResponseModel(
        result.data,
        HttpStatusCodes.OK,
        "Sports list retrieved successfully"
      );
      res.status(HttpStatusCodes.OK).json(response.generate());
    } catch (err) {
      this.logger.error("Sports Controller: getSportsList : Error", err);
      next(err);
    }
  }

  public async getPopularEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Sports Controller>: getPopularEvents method : Processing");
    try {
      const result = await this.sportsService.fetchPopularEvents();
      
      const response = new ResponseModel(
        result,
        HttpStatusCodes.OK,
        "Popular events retrieved successfully"
      );
      res.status(HttpStatusCodes.OK).json(response.generate());
    } catch (err) {
      this.logger.error("Sports Controller: getPopularEvents : Error", err);
      next(err);
    }
  }

  public async getUpcomingEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Sports Controller>: getUpcomingEvents method : Processing");
    try {
      const { sportId } = req.query;
  
      const result = await this.sportsService.fetchUpcomingEvents({
        sportId: sportId as string,
        // limit: limit ? parseInt(limit as string) : 10,
        // offset: offset ? parseInt(offset as string) : 0
      });
  
      if (result.success) {
        const response = new ResponseModel(
          result,
          HttpStatusCodes.OK,
          "Upcoming events retrieved successfully"
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Something went wrong").generate()
        );
      }
    } catch (err) {
      this.logger.error("Sports Controller: getUpcomingEvents : Error", err);
      next(err);
    }
  }
  public async getInplayEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Sports Controller>: getUpcomingEvents method : Processing");
    try {
      const { sportId } = req.query;
  
      const result = await this.sportsService.fetchInplayEvents({
        sportId: sportId as string,
        // limit: limit ? parseInt(limit as string) : 10,
        // offset: offset ? parseInt(offset as string) : 0
      });
  
      if (result.success) {
        const response = new ResponseModel(
          result,
          HttpStatusCodes.OK,
          "Inplay events retrieved successfully"
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Something went wrong").generate()
        );
      }
    } catch (err) {
      this.logger.error("Sports Controller: getInplayEvents : Error", err);
      next(err);
    }
  }
  public async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Sports Controller>: getResults method : Processing");
    try {
      const { eventId } = req.query;
  
      const result = await this.sportsService.fetchResults({
        eventId: eventId as string,
      });
  
      if (result.success) {
        const response = new ResponseModel(
          result,
          HttpStatusCodes.OK,
          "Event results retrieved successfully"
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Something went wrong").generate()
        );
      }
    } catch (err) {
      this.logger.error("Sports Controller: getResults : Error", err);
      next(err);
    }
  }

  public validate(method: string): any[] {
    switch (method) {
      case "getSportsList":
        return [];
      case "getPopularEvents":
        return [
          body("limit").optional().isNumeric().withMessage("Limit must be a number")
        ];

    case "getSportOdds":
      return [

      ];
    case "getResults":
      return [

      ];

    case "getUpcomingEvents":
      return [
        body("sportId").optional().isString().withMessage("Sport ID must be a string"),
        // body("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
        // body("offset").optional().isInt({ min: 0 }).withMessage("Offset must be a positive number")
      ];
      default:
        return [];
    }
  }
}