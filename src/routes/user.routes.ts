import { Router } from "express";
import { UserController } from "@controllers/user.controller"
import Container from "typedi";
import authorize from "@middlewares/auth";
import { StaffRole } from "@enums/user-role.enum";

export class UserRoute {
  private api: Router = Router();
  private readonly userController: UserController = Container.get(UserController);

  public getApi(): Router {


    // Admin only routes
    this.api.get(
      '/export',
      authorize([StaffRole.ADMIN]),
      this.userController.exportCustomerData.bind(this.userController)
    );
    
    this.api.get(
      "/",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.userController.listUsers.bind(this.userController)
    );

    this.api.get(
      "/:userId",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.userController.getUserDetails.bind(this.userController)
    );

    this.api.put(
      "/:userId",
      authorize([StaffRole.ADMIN]),
      this.userController.updateUser.bind(this.userController)
    );

    this.api.put(
      "/:userId/password",
      authorize([StaffRole.ADMIN]),
      this.userController.updatePasswordByAdmin.bind(this.userController)
    );

   

    // User routes
    this.api.get(
      "/me/profile",
      authorize(),
      this.userController.getMyDetails.bind(this.userController)
    );

    this.api.put(
      "/me/profile",
      authorize(),
      this.userController.updateMyDetails.bind(this.userController)
    );
    this.api.delete(
      "/:userId",
      authorize([StaffRole.ADMIN]), // Only admin can delete users
      this.userController.deleteUser.bind(this.userController)
    );
    return this.api;
  }
}