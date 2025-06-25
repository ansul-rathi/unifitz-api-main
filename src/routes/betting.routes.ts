// import { Router } from 'express';
// import { Container } from 'typedi';
// import { validationHandler } from '@middlewares/errorHandler';
// import { BettingController } from '@controllers/betting.controller';

// export class BettingRoute {
//   private api: Router = Router();
//   private readonly bettingController: BettingController = 
//     Container.get(BettingController);

//   constructor() {
//     this.bettingController = new BettingController();
//     this.routes();
//   }

//   public getApi(): Router {
//     return this.api;
//   }

//   private routes(): void {
//     this.api.post(
//       '/place',
//       this.bettingController.validate('placeBet'),
//       validationHandler(),
//       this.bettingController.placeBet.bind(this.bettingController)
//     );

//     this.api.get(
//       '/:id',
//       this.bettingController.validate('getBet'),
//       validationHandler(),
//       this.bettingController.getBetById.bind(this.bettingController)
//     );

//     this.api.get(
//       '/user/:userId',
//       this.bettingController.validate('getUserBets'),
//       validationHandler(),
//       this.bettingController.getBetsByUserId.bind(this.bettingController)
//     );

//     // Additional betting routes
//     this.api.get(
//       '/history',
//       this.bettingController.validate('getBetHistory'),
//       validationHandler(),
//       this.bettingController.getBetHistory.bind(this.bettingController)
//     );

//     this.api.post(
//       '/cancel/:betId',
//       this.bettingController.validate('cancelBet'),
//       validationHandler(),
//       this.bettingController.cancelBet.bind(this.bettingController)
//     );
//   }
// }