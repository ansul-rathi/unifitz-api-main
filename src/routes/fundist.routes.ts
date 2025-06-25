import { Router } from "express";
import { FundistController } from "@controllers/fundist.controller";
import Container from "typedi";
import { responseLogger } from "../logger/response-logger";
import fundistAuthMiddleware from "@middlewares/fundist";
import authorize from "@middlewares/auth";
import { StaffRole } from "@enums/user-role.enum";

export class FundistRoute {
  private api: Router = Router();
  private readonly fundistController: FundistController = Container.get(FundistController);

  public getApi(): Router {
    this.api.use(responseLogger());


    // Main handler for all Fundist requests
    this.api.post(
      "/",
      fundistAuthMiddleware(),
      this.fundistController.handleFundistOneWallet.bind(this.fundistController)
    );
    this.api.get(
      "/games/all",
      // authorize(),
      this.fundistController.getAllGames.bind(this.fundistController)
    );
    this.api.get(
      "/games/available",
      authorize(),
      this.fundistController.getGames.bind(this.fundistController)
    );
    this.api.get(
      "/games/categories",
      // authorize(),
      this.fundistController.getCategories.bind(this.fundistController)
    );

    this.api.get(
      "/games/demo-launch",
      authorize(),
      this.fundistController.demoLaunchGame.bind(this.fundistController)
    );
    this.api.get(
      "/games/launch",
      authorize(),
      this.fundistController.launchGame.bind(this.fundistController)
    );
    this.api.get(
      "/games/sorted",
      authorize(),
      this.fundistController.getSortedGames.bind(this.fundistController)
    );
    this.api.get(
      "/lobby-state",
      authorize(),
      this.fundistController.getLobbyState.bind(this.fundistController)
    );
    this.api.get(
      "/auth",
      authorize(),
      this.fundistController.auth.bind(this.fundistController)
    );

    // restricted countries routes
    this.api.get(
      '/restricted-countries',
      authorize(),
      this.fundistController.getRestrictedCountries.bind(this.fundistController)
    );

    // Check if country is restricted - Public
    this.api.get(
      '/restricted-countries/check',
      this.fundistController.checkCountryRestriction.bind(this.fundistController)
    );


    // Protected routes (staff only)
    this.api.post(
      "/games/sync",
      authorize([StaffRole.ADMIN]),
      this.fundistController.syncGames.bind(this.fundistController)
    );

    // Transactions route 
    this.api.get(
      "/transactions",
      authorize(),
      this.fundistController.getCasinoTransactions.bind(this.fundistController)
    );


    return this.api;
  }
}