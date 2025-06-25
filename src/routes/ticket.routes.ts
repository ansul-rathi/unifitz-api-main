import { Router } from "express";
import { TicketController } from "@controllers/ticket.controller";
import Container from "typedi";
import authorize from "@middlewares/auth";
import { StaffRole } from "@enums/user-role.enum";

export class TicketRoute {
  private api: Router = Router();
  private readonly ticketController: TicketController = Container.get(TicketController);

  public getApi(): Router {

    this.api.get(
      "/:ticketId/conversations",
      authorize(),
      this.ticketController.getConversations.bind(this.ticketController)
    );


    this.api.post(
      "/:ticketId/conversations",
      authorize(),
      this.ticketController.addConversation.bind(this.ticketController)
    );
   

    this.api.post(
      "/assign",
      authorize(),
      this.ticketController.assignTicket.bind(this.ticketController)
    );

    this.api.get(
      "/counts",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.ticketController.getTicketCounts.bind(this.ticketController)
    );

    this.api.post(
      "/",
      authorize(),
      this.ticketController.createTicket.bind(this.ticketController)
    );

    this.api.get(
      "/",
      authorize(),
      this.ticketController.listTickets.bind(this.ticketController)
    );

    this.api.get(
      "/:ticketId",
      authorize(),
      this.ticketController.getTicket.bind(this.ticketController)
    );

    this.api.put(
      "/:ticketId",
      authorize(),
      this.ticketController.updateTicket.bind(this.ticketController)
    );
    this.api.post(
      "/:ticketId/resolve",
      authorize([StaffRole.ADMIN, StaffRole.AGENT]),
      this.ticketController.resolveTicket.bind(this.ticketController)
    );
   

    return this.api;
  }
}
