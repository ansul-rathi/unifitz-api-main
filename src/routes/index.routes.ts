/* eslint-disable @typescript-eslint/no-var-requires */
import { Router } from "express";

import { AuthRoute } from "./auth.routes";
import { SportsRoute } from "./sports.routes";
import { InplayRoute } from "./inplay.routes";
import { OddsRoute } from "./odds.routes";
// import { BettingSlipRoute } from "./betting-slip.routes";
import { StaffRoute } from "./staff.routes";
import { GroupRoute } from "./group.routes";
import { LuckySportsRoute } from "./lucky-sports.routes";
import { TicketRoute } from "./ticket.routes";
import { WalletRoute } from "./wallet.routes";
import { UserRoute } from "./user.routes";
import { FundistRoute } from "./fundist.routes";
import { BannerRoute } from "./banner.routes";
import { WinPartnerRoute } from "./win-partner.routes";
import { BankingDetailsRoute } from "./banking-details.routes";
// import { HZPaysRoutes } from "./hzpays.routes";
import { PaymentRoute } from "./payment.routes";
// import { SportsBookRoute } from "./sportsbook.routes";
// import { ExchangeRoute } from "./exchange.routes";

/**
 * Root api router specifications
 * => API_URL/api/
 */
export class IndexRoute {
  private api: Router = Router();
  private authRoute: AuthRoute;
  private userRoute: UserRoute;
  // private bettingRoute: BettingRoute;
  // private bettingSlipRoute: BettingSlipRoute;
  private inplayRoute: InplayRoute;
  private sportsRoute: SportsRoute;
  private oddsRoute: OddsRoute;

  private staffRoute: StaffRoute;
  private groupRoute: GroupRoute;
  private luckySportsRoute: LuckySportsRoute;
  private ticketsRoute: TicketRoute;
  private walletRoute: WalletRoute;
  private fundistRoute: FundistRoute;
  private bannerRoute: BannerRoute;
  private winpartnerRoute: WinPartnerRoute;
  private bankingDetailRoute: BankingDetailsRoute;
  // private hzPaysRoutes: HZPaysRoutes;
  private paymentRoute: PaymentRoute;

  // private sportsBookRoute: SportsBookRoute;
  // private exchangeRoute: ExchangeRoute;

  constructor() {
    this.authRoute = new AuthRoute();
    this.userRoute = new UserRoute();
    this.inplayRoute = new InplayRoute();
    this.sportsRoute = new SportsRoute();
    this.oddsRoute = new OddsRoute();
    this.staffRoute = new StaffRoute();
    this.groupRoute = new GroupRoute();
    this.ticketsRoute = new TicketRoute();
    this.walletRoute = new WalletRoute();
    this.bannerRoute = new BannerRoute();
    this.winpartnerRoute = new WinPartnerRoute();
    this.bankingDetailRoute = new BankingDetailsRoute();
    this.paymentRoute = new PaymentRoute();

    this.luckySportsRoute = new LuckySportsRoute();
    this.fundistRoute = new FundistRoute();
    this.routes();
  }

  /**
   * @return The application router/api
   */
  public getApi(): Router {
    return this.api;
  }

  private routes(): void {
    this.api.use("/auth", this.authRoute.getApi());
    this.api.use("/users", this.userRoute.getApi());
    this.api.use("/inplay", this.inplayRoute.getApi());
    this.api.use("/sports", this.sportsRoute.getApi());
    this.api.use("/odds", this.oddsRoute.getApi());

    this.api.use("/staff", this.staffRoute.getApi());
    this.api.use("/group", this.groupRoute.getApi());
    this.api.use("/tickets", this.ticketsRoute.getApi());
    this.api.use("/wallet", this.walletRoute.getApi());
    this.api.use("/banner", this.bannerRoute.getApi());
    this.api.use("/partner", this.winpartnerRoute.getApi());
    this.api.use("/banking-details", this.bankingDetailRoute.getApi());

    // third party integrations
    this.api.use("/ls", this.luckySportsRoute.getApi());
    this.api.use("/casino", this.fundistRoute.getApi());
    //  payment
    this.api.use("/payments", this.paymentRoute.getApi());
    //  this.api.use("/payment/hzpays", this.hzPaysRoutes.getApi());
  }
}
