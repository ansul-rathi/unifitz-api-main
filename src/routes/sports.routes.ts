import { Router } from 'express';
import { Container } from 'typedi';
import { validationHandler } from '@middlewares/errorHandler';
import { SportsController } from '@controllers/sports.controller';

export class SportsRoute {
  private api: Router = Router();
  private readonly sportsController: SportsController = 
    Container.get(SportsController);

  constructor() {
    this.sportsController = new SportsController();
    this.routes();
  }

  public getApi(): Router {
    return this.api;
  }

  private routes(): void {
    this.api.get(
      '/list',
      this.sportsController.validate('getSportsList'),
      validationHandler(),
      this.sportsController.getSportsList.bind(this.sportsController)
    );
    this.api.get(
      '/upcoming',
      this.sportsController.validate('getUpcomingEvents'),
      validationHandler(),
      this.sportsController.getUpcomingEvents.bind(this.sportsController)
    );
    this.api.get(
      '/inplay',
      this.sportsController.validate('getInplayEvents'),
      validationHandler(),
      this.sportsController.getInplayEvents.bind(this.sportsController)
    );

    this.api.get(
      '/results',
      this.sportsController.validate('getResults'),
      validationHandler(),
      this.sportsController.getResults.bind(this.sportsController)
    );

    // this.api.get(
    //   '/popular',
    //   this.sportsController.validate('getPopularEvents'),
    //   validationHandler(),
    //   this.sportsController.getPopularEvents.bind(this.sportsController)
    // );
  }
}