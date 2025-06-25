import { WalletController } from "@controllers/wallet.controller";
import { StaffRole } from "@enums/user-role.enum";
import authorize from "@middlewares/auth";
import { validationHandler } from "@middlewares/errorHandler";
import { Router } from "express";
// import { WalletController } from '../controllers/wallet.controller';
// import { authMiddleware, staffMiddleware } from '../middlewares';
import Container, { Service } from "typedi";

@Service()
export class WalletRoute {
  private api: Router = Router();
  private readonly walletController: WalletController =
    Container.get(WalletController);

  constructor() {
    this.walletController = new WalletController();
    this.routes();
  }
  public getApi(): Router {
    return this.api;
  }

  private routes() {
    
    this.api.get(
      "/me",
      authorize(),
      this.walletController.validate("getMyBalance"),
      validationHandler(),
      this.walletController.getMyBalance.bind(this.walletController)
    );
    this.api.get(
      "/balance",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.walletController.validate("getBalance"),
      validationHandler(),
      this.walletController.getBalance.bind(this.walletController)
    );

    this.api.post(
      "/deposit",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.walletController.validate("staffDeposit"),
      validationHandler(),
      this.walletController.staffDeposit.bind(this.walletController)
    );
    this.api.post(
      "/admin/deposit",
      authorize([StaffRole.ADMIN]),
      this.walletController.validate("staffDeposit"),
      validationHandler(),
      this.walletController.adminDeposit.bind(this.walletController)
    );

    this.api.post(
      "/withdraw",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.walletController.validate("staffWithdraw"),
      validationHandler(),
      this.walletController.staffWithdraw.bind(this.walletController)
    );
    this.api.post(
      "/admin/withdraw",
      authorize([StaffRole.ADMIN]),
      this.walletController.validate("staffWithdraw"),
      validationHandler(),
      this.walletController.adminWithdraw.bind(this.walletController)
    );

    this.api.get(
      "/:userId/transactions",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.walletController.validate("getTransactions"),
      validationHandler(),
      this.walletController.getTransactions.bind(this.walletController)
    );
    this.api.get(
      "/transactions",
      authorize(),
      this.walletController.validate("getTransactions"),
      validationHandler(),
      this.walletController.getMyTransactions.bind(this.walletController)
    );

  }
}
