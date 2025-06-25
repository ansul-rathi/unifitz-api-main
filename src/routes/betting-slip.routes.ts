// import { Router } from 'express';
// import { Container } from 'typedi';
// import { validationHandler } from '@middlewares/errorHandler';
// import authorize from '@middlewares/auth';
// import { BettingSlipController } from '@controllers/betting-slip.controller';
// // import { UserRole } from '@enums/user-role.enum';

// export class BettingSlipRoute {
//   private api: Router = Router();
//   private readonly bettingSlipController: BettingSlipController = Container.get(BettingSlipController);

//   constructor() {
//     this.routes();
//   }

//   public getApi(): Router {
//     return this.api;
//   }

//   private routes(): void {
//     // Create new betting slip
//     this.api.post(
//       '/',
//       authorize(),
//       this.bettingSlipController.validate('createSlip'),
//       validationHandler(),
//       this.bettingSlipController.createSlip.bind(this.bettingSlipController)
//     );
//     this.api.get(
//       '/',
//       authorize(),
//       this.bettingSlipController.validate('listSlips'),
//       validationHandler(),
//       this.bettingSlipController.listSlips.bind(this.bettingSlipController)
//     );

//     // Get slip details
//     this.api.get(
//       '/:slipId',
//       authorize(),
//       this.bettingSlipController.validate('getSlip'),
//       validationHandler(),
//       this.bettingSlipController.getSlip.bind(this.bettingSlipController)
//     );

//     // Add selection to slip
//     this.api.post(
//       '/:slipId/selections',
//       authorize(),
//       this.bettingSlipController.validate('addSelection'),
//       validationHandler(),
//       this.bettingSlipController.addSelection.bind(this.bettingSlipController)
//     );

//     // Remove selection from slip
//     this.api.delete(
//       '/:slipId/selections/:selectionId',
//       authorize(),
//       this.bettingSlipController.validate('removeSelection'),
//       validationHandler(),
//       this.bettingSlipController.removeSelection.bind(this.bettingSlipController)
//     );

//     // Validate slip
//     this.api.post(
//       '/:slipId/validate',
//       authorize(),
//       this.bettingSlipController.validate('validateSlip'),
//       validationHandler(),
//       this.bettingSlipController.validateSlip.bind(this.bettingSlipController)
//     );

//     // Place bet
//     this.api.post(
//       '/:slipId/place',
//       authorize(),
//       this.bettingSlipController.validate('placeBet'),
//       validationHandler(),
//       this.bettingSlipController.placeBet.bind(this.bettingSlipController)
//     );
//   }
// }