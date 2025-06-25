import { Container,Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import { TicketService } from "@services/ticket.service";
import { Logger } from 'winston';
import HttpStatusCodes from "http-status-codes";
import ResponseModel from "@models/response.model";
import { IRequest } from "@interfaces/express.interface";
import { StaffRole } from "@enums/user-role.enum";
import { IConversationRequest } from "@interfaces/conversation.interface";
import Busboy from "busboy";
import fs from "fs";
import path from "path";
import { TransactionCoordinatorService } from "@services/transaction-coordinator.service";
import { IStaffWalletOperation } from "@interfaces/wallet.interface";
import { GroupService } from "@services/group.service";
@Service()
export class TicketController {
  private logger: Logger = Container.get('logger');
  private ticketService: TicketService = Container.get(TicketService);
  private transactionCoordinator: TransactionCoordinatorService = Container.get(TransactionCoordinatorService);
  private groupService: GroupService = Container.get(GroupService);
  
  private async getGroupIdForTicket(ticketType: string): Promise<string | null> {
    try {
      let groupName: string;
      
      switch (ticketType.toUpperCase()) {
        case 'WITHDRAW':
          groupName = 'WITHDRAW';
          break;
        case 'DEPOSIT':
          groupName = 'DEPOSIT';
          break;
        case 'SUPPORT':
          groupName = 'SUPPORT';
          break;
        default:
          return null;
      }
  
      const result = await this.groupService.getGroupByName(groupName);
      
      if (!result.success || !result.data) {
        this.logger.warn(`Group not found for ticket type: ${ticketType}`);
        return null;
      }
  
      return result.data._id;
    } catch (error) {
      this.logger.error('Error getting group for ticket:', error);
      return null;
    }
  }

  public async createTicket(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.user.id;
      const userType = req.userType;
      
      const groupId = await this.getGroupIdForTicket(req.body.type);
      const body = {
        ...req.body,
        createdBy: id,
        createdByModel: userType,
        group: groupId 
      };

      const result = await this.ticketService.createTicket(body);

      if (result.success) {
        res
          .status(HttpStatusCodes.CREATED)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.CREATED,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }

  public async getTicket(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ticketId } = req.params;
      const result = await this.ticketService.getTicket(ticketId);

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.NOT_FOUND)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.NOT_FOUND,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }

  public async listTickets(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;

      // Remove assignedTo from query if it's an agent
      if (userRole === StaffRole.AGENT) {
        delete req.query.assignedTo;
      }

      const result = await this.ticketService.listTickets(
        req.query,
        userRole,
        userId
      );

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }
  public async getTicketCounts(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.ticketService.getTicketCounts(
        req.user.role,
        req.user.id
      );

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }
  

  public async updateTicket(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ticketId } = req.params;
      const result = await this.ticketService.updateTicket(ticketId, req.body);

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.NOT_FOUND)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.NOT_FOUND,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }
  public async assignTicket(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ticketId, agentId } = req.body;
      const result = await this.ticketService.assignTicket(ticketId, agentId);

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }
  public async resolveTicket(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ticketId } = req.params;
      const staffId = req.user.id;
      const { 
        amount, 
        comment, 
        paymentTxnId,
        status = 'CLOSED',
      } = req.body;
      const allowedStatus = ['REJECTED', 'CLOSED'];
      if (!allowedStatus.includes(status)) {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, "Invalid status. accepted statuses: " + allowedStatus.join(', ')).generate()
        );
        return;
      }

      const ticket = await this.ticketService.getTicket(ticketId);
      if (!ticket.success) {
        throw new Error(ticket.message);
      }
      if (ticket.data.status === 'CLOSED' || ticket.data.status === 'REJECTED') {
        throw new Error('Ticket is already resolved');
      }
      
      const operation = ticket.data.type;

      const operationData: IStaffWalletOperation = {
        userId: ticket.data.createdBy,
        amount: Number(amount),
        description: comment,
        staffId,
        ticketId,
        paymentTxnId,
        holdLedgerTransactionId: ticket.data?.recipientDetails?.holdLedgerTransactionId,
        ticketResolution: {
          status,
          comment
        }
      };

      let result;
      switch (operation) {
        case 'WITHDRAW':
          // result = await this.transactionCoordinator.processStaffWithdrawal(operationData);
          if (status === 'REJECTED') {
            result = await this.transactionCoordinator.processStaffRejectWithdrawal(operationData);
          } else {
            result = await this.transactionCoordinator.processStaffWithdrawal(operationData);
          }
          break;
        case 'DEPOSIT':
          if (status === 'REJECTED') {
            result = await this.transactionCoordinator.processStaffRejectDeposit(operationData);
          } else {
            result = await this.transactionCoordinator.processStaffDeposit(operationData);
          }
          break;
        default:
          // For non-financial resolutions
          result = await this.ticketService.updateTicket(ticketId, {
            status: 'CLOSED',
            resolution: {
              comment,
              resolvedBy: staffId,
              resolvedAt: new Date()
            }
          });

          // Add resolution conversation
          await this.ticketService.addConversation(ticketId, {
            message: `Ticket resolved. ${comment}`,
            sender: staffId
          });
          break;
      }

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async addConversation(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ticketId } = req.params;
      const sender = req.user.id;
      let message = "";
      let attachment: any = null;

      const busboy = Busboy({ headers: req.headers });

      // To store the parsed fields
      const formData: { [key: string]: any } = {};

      busboy.on("field", (fieldname, value) => {
        formData[fieldname] = value;
      });

      busboy.on("file", (_fieldname, file, fileData, _encoding, _mimetype) => {
        const date = new Date().toISOString().replace(/[:.]/g, "-");
        // Save file to a temporary location (or buffer if needed)
        const filename = fileData?.filename || date;
        const saveTo = path.join(__dirname, "../../uploads", filename);
        const writeStream = fs.createWriteStream(saveTo);
        file.pipe(writeStream);

        attachment = {
          filePath: saveTo,
          originalName: filename,
          mimeType: fileData?.mimeType,
        };
      });

      busboy.on("finish", async () => {
        message = formData["message"] || "";
        // Create conversation request object
        const conversationRequest: IConversationRequest = {
          message,
          sender,
        };
        if (attachment) {
          conversationRequest.attachment = attachment;
        }
        const result = await this.ticketService.addConversation(
          ticketId,
          conversationRequest
        );

        if (result.success) {
          res
            .status(HttpStatusCodes.OK)
            .json(
              new ResponseModel(
                result.data,
                HttpStatusCodes.OK,
                result.message
              ).generate()
            );
        } else {
          res
            .status(HttpStatusCodes.BAD_REQUEST)
            .json(
              new ResponseModel(
                null,
                HttpStatusCodes.BAD_REQUEST,
                result.message
              ).generate()
            );
        }
      });
      req.pipe(busboy);
    } catch (error) {
      next(error);
    }
  }

  public async getConversations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { startTimestamp, endTimestamp } = req.query;

      const result = await this.ticketService.getConversations(ticketId, {
        startTimestamp: startTimestamp as string,
        endTimestamp: endTimestamp as string,
      });

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }
}
