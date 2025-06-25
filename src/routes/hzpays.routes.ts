// import { Router } from "express";
// import { Container, Service } from "typedi";
// import { HZPaysController } from "@controllers/hzpays.controller";
// import authorize from "@middlewares/auth";

// @Service()
// export class HZPaysRoutes {
//   private api: Router = Router();
//   private readonly hzPaysController: HZPaysController = Container.get(HZPaysController);

//   constructor() {
//     this.routes();
//   }

//   public getApi(): Router {
//     return this.api;
//   }

//   private routes(): void {
//     // Payment callback from HZPays
//     // No authorization middleware as this is called by the payment provider
//     this.api.post(
//       "/callback",
//       this.hzPaysController.handlePaymentCallback.bind(this.hzPaysController)
//     );
    
//     // Payout notification callback from HZPays
//     // No authorization middleware as this is called by the payment provider
//     this.api.post(
//       "/payout-callback",
//       this.hzPaysController.handlePayoutNotification.bind(this.hzPaysController)
//     );

//     // Create a payment directly (for testing or admin purposes)
//     this.api.post(
//       "/create",
//       authorize(),
//       this.hzPaysController.createPayment.bind(this.hzPaysController)
//     );

//     // Query payment status
//     this.api.get(
//       "/status/:reference",
//       authorize(),
//       this.hzPaysController.queryPaymentStatus.bind(this.hzPaysController)
//     );
    
//     // Query account balance
//     this.api.get(
//       "/balance",
//       authorize(['admin']), // Restrict to admin users only
//       this.hzPaysController.queryAccountBalance.bind(this.hzPaysController)
//     );
    
//     // Create payout order (withdrawal)
//     this.api.post(
//       "/payout",
//       authorize(),
//       this.hzPaysController.createPayoutOrder.bind(this.hzPaysController)
//     );
    
//     // Query payout status (withdrawal)
//     this.api.get(
//       "/payout-status/:reference",
//       authorize(),
//       this.hzPaysController.queryPayoutStatus.bind(this.hzPaysController)
//     );
//   }
// }