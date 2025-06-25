import { Router } from 'express';
import { OddsController } from '@controllers/odds.controller';
import { Container } from 'typedi';
import authorize from '@middlewares/auth';

export class OddsRoute {
  private api: Router = Router();
  private readonly oddsController: OddsController = Container.get(OddsController);

  constructor() {
    this.routes();
  }

  public getApi(): Router {
    return this.api;
  }

  private routes(): void {
    this.api.get(
      '/prematch/:fixtureId',
      authorize(),
      this.oddsController.getPreMatchOdds.bind(this.oddsController)
    );
    this.api.get(
      '/inplay/:fixtureId',
      authorize(),
      this.oddsController.getInPlayOdds.bind(this.oddsController)
    );
  }
 
}