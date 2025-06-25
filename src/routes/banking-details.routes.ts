import { Router } from "express";
import { BankingDetailsController } from "@controllers/banking-details.controller";
import Container from "typedi";
import authorize from "@middlewares/auth";
import { StaffRole } from "@enums/user-role.enum";

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
// });

export class BankingDetailsRoute {
  private api: Router = Router();
  private readonly bankingDetailsController: BankingDetailsController =
    Container.get(BankingDetailsController);

  public getApi(): Router {
    this.api.post(
      "/",
      authorize([StaffRole.ADMIN]),
    //   upload.single("qrCode"),
      this.bankingDetailsController.upsertBankingDetails.bind(
        this.bankingDetailsController
      )
    );
    this.api.get(
      "/",
      authorize(),
      this.bankingDetailsController.getBankingDetails.bind(
        this.bankingDetailsController
      )
    );

    return this.api;
  }
}
