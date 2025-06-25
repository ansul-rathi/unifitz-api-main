import { GroupController } from "@controllers/group.controller";
import { StaffRole } from "@enums/user-role.enum";
import authorize from "@middlewares/auth";
import { Router } from "express";
import Container from "typedi";

export class GroupRoute {
  private api: Router = Router();
    private readonly groupController: GroupController = Container.get(GroupController);
  

  public getApi(): Router {
    this.api.post(
      "/create",
      authorize([StaffRole.ADMIN]),
      this.groupController.createGroup.bind(this.groupController)
    );
    

    this.api.put(
      "/update",
      authorize([StaffRole.ADMIN]),
      this.groupController.updateGroup.bind(this.groupController)
    );

    this.api.get(
      "/list",
      authorize([StaffRole.ADMIN]),
      this.groupController.listGroups.bind(this.groupController)
    );

    this.api.get(
      "/me",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.groupController.listMyGroups.bind(this.groupController)
    );

    this.api.post(
      "/add-agent",
      authorize([StaffRole.ADMIN]),
      this.groupController.addAgentToGroup.bind(this.groupController)
    );
    this.api.post(
      "/remove-agent",
      authorize([StaffRole.ADMIN]),
      this.groupController.removeAgentFromGroup.bind(this.groupController)
    );

    this.api.get(
      "/:id",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.groupController.getGroupDetails.bind(this.groupController)
    );

    return this.api;
  }
}