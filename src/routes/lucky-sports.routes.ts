import { Router } from "express";
import { LuckySportsController } from "@controllers/lucky-sports.controller";
import Container from "typedi";
import luckySportsAuthMiddleware from "@middlewares/luckysports";
import { responseLogger } from "../logger/response-logger"
import authorize from "@middlewares/auth";

export class LuckySportsRoute {
  private api: Router = Router();
  private readonly luckySportsController: LuckySportsController = Container.get(LuckySportsController);

  public getApi(): Router {

    this.api.use(responseLogger());

    this.api.get(
      "/get-id-token",
      this.luckySportsController.getIDToken.bind(this.luckySportsController)
    );

    this.api.get(
      "/guest-token", 
      this.luckySportsController.getGuestToken.bind(this.luckySportsController)
    );

    this.api.post(
      "/create-member",
      this.luckySportsController.createMember.bind(this.luckySportsController)
    );

    this.api.post(
      "/login-member",
      this.luckySportsController.loginMember.bind(this.luckySportsController)
    );

    this.api.get(
      "/trades",
      authorize(),
      this.luckySportsController.listTrades.bind(this.luckySportsController)
    );

    // Betting routes
    this.api.post(
      "/bet/make",
      luckySportsAuthMiddleware(),
      this.luckySportsController.placeSportsbookBet.bind(this.luckySportsController)
    );

    this.api.post(
      "/exchange/make",
      luckySportsAuthMiddleware(),

      this.luckySportsController.placeExchangeBet.bind(this.luckySportsController)
    );

   

    // Settlement routes
    this.api.post(
      "/bet/win",
      luckySportsAuthMiddleware(),

      this.luckySportsController.settleSportsbookWin.bind(this.luckySportsController)
    );

    this.api.post(
      "/bet/lost",
      luckySportsAuthMiddleware(),

      this.luckySportsController.settleSportsbookLoss.bind(this.luckySportsController)
    );

    this.api.post(
      "/exchange/payout",
      luckySportsAuthMiddleware(),

      this.luckySportsController.settleExchangeBet.bind(this.luckySportsController)
    );

    this.api.post(
      "/bet/rollback",
      luckySportsAuthMiddleware(),

      this.luckySportsController.rollbackBet.bind(this.luckySportsController)
    );

    // Balance and bonus routes
    this.api.get(
      "/balance",
      // luckySportsAuthMiddleware(),
      this.luckySportsController.getBalance.bind(this.luckySportsController)
    );

    this.api.post(
      "/bet/refund",
      luckySportsAuthMiddleware(),
      this.luckySportsController.processBonusPayout.bind(this.luckySportsController)
    );

    this.api.post(
      "/test",
      luckySportsAuthMiddleware(),
      this.luckySportsController.test.bind(this.luckySportsController)
    );
    

    return this.api;
  }
}