import { Router } from 'express';
import { Container } from 'typedi';
import { validationHandler } from '@middlewares/errorHandler';
import { InplayController } from '@controllers/inplay.controller';

export class InplayRoute {
  private api: Router = Router();
  private readonly inplayController: InplayController = 
    Container.get(InplayController);

  constructor() {
    this.inplayController = new InplayController();
    this.routes();
  }

  public getApi(): Router {
    return this.api;
  }

  private routes(): void {
    this.api.get(
      '/events',
      this.inplayController.validate('getInplayEvents'),
      validationHandler(),
      this.inplayController.getInplayData.bind(this.inplayController)
    );

    this.api.post(
      '/bet',
      this.inplayController.validate('placeInplayBet'),
      validationHandler(),
      this.inplayController.placeInplayBet.bind(this.inplayController)
    );

    this.api.get(
      '/odds/:eventId',
      this.inplayController.validate('getInplayOdds'),
      validationHandler(),
      this.inplayController.getInplayOdds.bind(this.inplayController)
    );

    // this.api.get(
    //   '/stats/:eventId',
    //   this.inplayController.validate('getInplayStats'),
    //   validationHandler(),
    //   this.inplayController.getInplayStats.bind(this.inplayController)
    // );
  }
}