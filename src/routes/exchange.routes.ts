// import { Router } from "express";
// import Container from "typedi";
// // import { ExchangeController } from "@controllers/exchange.controller";

// export class ExchangeRoute {
//   private api: Router = Router();
//   private readonly exchangeController: ExchangeController = Container.get(ExchangeController);

//   public getApi(): Router {
//     return this.api;
//   }
//   public routes(): Router {
//     this.api.post(
//       "/make",
//       this.exchangeController.make.bind(this.exchangeController)
//     );

//     return this.api;
//   }
 
// }