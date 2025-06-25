import { Router } from "express";
import { StaffController } from "@controllers/staff.controller";
import Container from "typedi";
import authorize from "@middlewares/auth";
import { StaffRole, UserRole } from "@enums/user-role.enum";
// import { StaffRole } from "@enums/user-role.enum";

export class StaffRoute {
  private api: Router = Router();
  private readonly staffController: StaffController =
    Container.get(StaffController);

  public getApi(): Router {
    this.api.post(
      "/create",
      authorize([StaffRole.ADMIN]),
      this.staffController.createStaff.bind(this.staffController)
    );

    this.api.put(
      "/update/:id",
      authorize([StaffRole.ADMIN]),
      this.staffController.updateStaff.bind(this.staffController)
    );

    this.api.get(
      "/list",
      authorize([StaffRole.ADMIN]),
      this.staffController.listStaff.bind(this.staffController)
    );

    this.api.get('/me',
      authorize([StaffRole.ADMIN, StaffRole.AGENT, UserRole.WIN_PARTNER]),
      this.staffController.getMe.bind(this.staffController)
    )
    this.api.put(
      "/:staffId/password",
      authorize([StaffRole.ADMIN]),
      this.staffController.updatePasswordByAdmin.bind(this.staffController)
    );


    this.api.post(
      "/login",
      this.staffController.login.bind(this.staffController)
    );
    return this.api;
  }
}
