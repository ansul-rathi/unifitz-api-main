import { Service, Container } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { OddsService } from '@services/odds.service';
import HttpStatusCodes from "http-status-codes";
import { Logger } from 'winston';
import ResponseModel from '@models/response.model';

@Service()
export class OddsController {
  private logger: Logger = Container.get('logger');
  private oddsService: OddsService = Container.get(OddsService);

  public async getPreMatchOdds(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Sports Controller>: getSportOdds method : Processing");
    try {
      const { fixtureId } = req.params;
  
      const result = await this.oddsService.getPreMatchOdds(fixtureId as string);
  
      if (result.success) {
        const response = new ResponseModel(
          result.results,
          HttpStatusCodes.OK,
          "Sport odds retrieved successfully"
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Something went wrong").generate()
        );
      }
    } catch (err) {
      this.logger.error("Sports Controller: getFixtureOdds : Error", err);
      next(err);
    }
  }
  public async getInPlayOdds(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.logger.info("<Sports Controller>: getInPlayOdds method : Processing");
    try {
      const { fixtureId } = req.params;
  
      const result = await this.oddsService.getInPlayOdds(fixtureId as string);
  
      if (result.success) {
        const response = new ResponseModel(
          result.results,
          HttpStatusCodes.OK,
          "Sport events retrieved successfully"
        );
        res.status(HttpStatusCodes.OK).json(response.generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Something went wrong").generate()
        );
      }
    } catch (err) {
      this.logger.error("Sports Controller: getInPlayOdds : Error", err);
      next(err);
    }
  }

}