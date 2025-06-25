import { ITicket } from "@models/ticket.model";
import { ServiceResponse } from "./service-response.interface";

export interface IGetTicket extends ServiceResponse{
    data: ITicket
}