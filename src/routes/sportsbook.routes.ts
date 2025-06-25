import { Router } from "express";
import { SportsBookController } from "@controllers/sports-book.controller";
import Container from "typedi";

export class SportsBookRoute {
  private api: Router = Router();
  private readonly sportsBookController: SportsBookController = Container.get(SportsBookController);

  public routes(): Router {
    
    this.api.post(
      "/make",
      this.sportsBookController.make.bind(this.sportsBookController)
    );


    return this.api;
  }
  public getApi(): Router {
    return this.api;
  }
}