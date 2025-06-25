import { Service, Container } from "typedi";
import { Logger } from "winston";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { TicketModel, ITicket } from "@models/ticket.model";
import { S3Service } from "./s3.service";
import {
  IConversationAttachment,
  IConversationRequest,
} from "@interfaces/conversation.interface";
import mongoose from "mongoose";
import { WalletService } from "./wallet.service";
// import { HZPaysService } from "./hzpays.service";
// import { HZPaysPayMethod } from "@interfaces/hzpays.interface";
import fs from "fs";
import { StaffRole, UserRole } from "@enums/user-role.enum";
import { IGetTicket } from "@interfaces/ticket.interface";
@Service()
export class TicketService {
  private logger: Logger = Container.get("logger");
  private s3Service: S3Service = Container.get(S3Service);
  private walletService: WalletService = Container.get(WalletService);
  // private hzPaysService: HZPaysService = Container.get(HZPaysService);

  private generateTicketNumber(): string {
    // Generate a random number and convert to hex, pad to 6 characters
    return Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase();
  }
  private async ensureUniqueTicketNumber(): Promise<string> {
    let ticketNo: string;
    let exists: boolean;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      ticketNo = this.generateTicketNumber();
      exists = (await TicketModel.exists({ ticketNo })) as any;
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique ticket number");
      }
    } while (exists);

    return ticketNo;
  }

  public async createTicket(data: Partial<ITicket>): Promise<ServiceResponse> {
    try {
      const ticketNumber = await this.ensureUniqueTicketNumber();

      // If it's a withdrawal ticket, create a hold first
      if (data.type === "WITHDRAW" && data.transactionDetails?.amount) {
        const holdResult = await this.walletService.holdBalance({
          userId: data.createdBy, // Assuming this is the user's ID
          amount: data.transactionDetails.amount,
          reference: `WITHDRAW-HOLD-${ticketNumber}`,
          metadata: {
            ticketNo: ticketNumber,
            type: "WITHDRAW",
          },
        });

        if (!holdResult.success) {
          throw new Error(holdResult.message);
        }

        // Add hold transaction ID to ticket data
        data.recipientDetails.holdLedgerTransactionId = holdResult.data.holdId;
      }

      const ticket = await TicketModel.create({
        ...data,
        status: "OPEN",
        ticketNo: ticketNumber,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Ticket created successfully",
        data: ticket,
      };
    } catch (error) {
      this.logger.error("Error creating ticket:", error);
      return {
        success: false,
        message: error.message || "Failed to create ticket",
        data: null,
      };
    }
  }

  /**
   * Maps internal payment methods to HZPays payment methods
   */
  // private getHzPaysPayMethod(internalMethod: string): string | null {
  //   switch (internalMethod) {
  //     case "UPI":
  //       return HZPaysPayMethod.UPI_INDIA;
  //     case "BANK_TRANSFER":
  //       return HZPaysPayMethod.NATIVE_INDIA;
  //     default:
  //       return null;
  //   }
  // }

  public async getTicket(identifier: string): Promise<IGetTicket> {
    try {
      let ticket: any;

      // If identifier is 6 characters, treat as ticket number
      if (identifier.length === 6) {
        ticket = await TicketModel.findOne({ ticketNo: identifier }).populate(
          "assignedTo group createdBy"
        );
      } else {
        // Otherwise treat as ticket ID
        ticket = await TicketModel.findById(identifier).populate(
          "assignedTo group createdBy"
        );
      }

      if (!ticket) {
        return {
          success: false,
          message: "Ticket not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Ticket retrieved successfully",
        data: ticket,
      };
    } catch (error) {
      this.logger.error("Error retrieving ticket:", error);
      return {
        success: false,
        message: "Failed to retrieve ticket",
        data: null,
      };
    }
  }
  async getTicketCounts(userRole: StaffRole, userId: string): Promise<ServiceResponse> {
    const pipeline: any[] = [];
    if (userRole === StaffRole.AGENT && userId) {
      pipeline.push(
        {
          $lookup: {
            from: "groups",
            localField: "group",
            foreignField: "_id",
            as: "group",
          },
        },
        {
          $unwind: {
            path: "$group",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "group.agents": new mongoose.Types.ObjectId(userId),
            $or: [
              { assignedTo: null },
              { assignedTo: new mongoose.Types.ObjectId(userId) },
            ],
          },
        }
      );
    }
    pipeline.push({
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    });
    pipeline.push({
      $group: {
        _id: null,
        totalCount: { $sum: "$count" },
        statusCounts: { $push: { status: "$_id", count: "$count" } },
      },
    })

    const counts = await TicketModel.aggregate(pipeline);

    return {
      success: true,
      data: {
        totalCount: counts[0]?.totalCount || 0,
        statusCounts: counts[0]?.statusCounts || [],
      },
      message: "Ticket counts retrieved successfully",
    };
  }

  public async listTickets(
    query: any,
    userRole?: string,
    userId?: string
  ): Promise<ServiceResponse> {
    try {
      const matchQuery: any = {};

      // If user is a regular user, show only tickets created by them
      if (userRole === UserRole.USER && userId) {
        matchQuery.createdBy = new mongoose.Types.ObjectId(userId);
      }

      if (query.status) {
        matchQuery.status = query.status;
      }

      if (query.type) {
        matchQuery.type = query.type;
      }

      if (query.group) {
        matchQuery.group = new mongoose.Types.ObjectId(query.group);
      }

      if (query.assignedTo) {
        matchQuery.assignedTo = new mongoose.Types.ObjectId(query.assignedTo);
      }

      // Date range filters
      if (query.startDate || query.endDate) {
        matchQuery.createdAt = {};
        if (query.startDate) {
          matchQuery.createdAt.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          matchQuery.createdAt.$lte = new Date(query.endDate);
        }
      }

      // Amount range filters
      if (query.minAmount || query.maxAmount) {
        matchQuery["transactionDetails.amount"] = {};
        if (query.minAmount) {
          matchQuery["transactionDetails.amount"].$gte = Number(
            query.minAmount
          );
        }
        if (query.maxAmount) {
          matchQuery["transactionDetails.amount"].$lte = Number(
            query.maxAmount
          );
        }
      }

      // Payment mode filter
      if (query.modeOfPayment) {
        matchQuery["transactionDetails.modeOfPayment"] = query.modeOfPayment;
      }

      // Handle search query
      if (query.search) {
        const searchRegex = new RegExp(query.search, "i"); // Case-insensitive search
        const searchAmount = !isNaN(Number(query.search))
          ? Number(query.search)
          : null; // Validate amount

        matchQuery.$or = [
          { ticketNo: searchRegex }, // Search by ticket number
          { title: searchRegex },
          { description: searchRegex },

          ...(searchAmount !== null
            ? [{ "transactionDetails.amount": searchAmount }] // Search by amount if valid
            : []),
          { "userDetails.name": searchRegex }, // Search by user name
          { "userDetails.email": searchRegex }, // Search by user email
          { "userDetails.phoneNumber": searchRegex }, // Search by user phone number
        ];
      }

      // Extract pagination parameters
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;
      const sortField = query.sortBy || "createdAt";
      const sortOrder = query.sortOrder === "asc" ? 1 : -1;

      // Build aggregation pipeline
      const pipeline = [
        {
          $lookup: {
            from: "groups", // Populate group field
            localField: "group",
            foreignField: "_id",
            as: "group",
          },
        },
        {
          $unwind: {
            path: "$group",
            preserveNullAndEmptyArrays: true, // Include tickets without a group
          },
        },
        {
          $match:
            userRole === StaffRole.AGENT && userId
              ? {
                  "group.agents": new mongoose.Types.ObjectId(userId),
                  $or: [
                    { assignedTo: null},
                    { assignedTo: new mongoose.Types.ObjectId(userId) },
                  ],
                }
              : {},
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "staff",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignedToStaff",
          },
        },
        {
          $unwind: {
            path: "$assignedToStaff",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Add assignedTo field back with staff details
        {
          $addFields: {
            assignedTo: "$assignedToStaff",
          },
        },

        {
          $match: matchQuery, // Apply the match query
        },

        {
          $sort: { [sortField]: sortOrder },
        },
        {
          $skip: skip, // Skip documents for pagination
        },
        {
          $limit: limit, // Limit the number of documents
        },

        {
          $project: {
            assignedToStaff: 0,
          },
        },
      ];
      const totalPipeline: any = [
        ...pipeline.slice(0, -3), // Remove skip, limit, and project stages
      ];
      // console.log({totalPipeline})
      totalPipeline.push({ $count: "total" });

      const [tickets, totalResult] = await Promise.all([
        TicketModel.aggregate(pipeline as any),
        TicketModel.aggregate(totalPipeline),
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      return {
        success: true,
        message: "Tickets retrieved successfully",
        data: {
          tickets,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      this.logger.error("Error listing tickets:", error);
      return {
        success: false,
        message: "Failed to retrieve tickets",
        data: null,
      };
    }
  }
  public async updateTicket(
    ticketId: string,
    data: Partial<ITicket> | any
  ): Promise<ServiceResponse> {
    try {
      const ticket = await TicketModel.findByIdAndUpdate(ticketId, data, {
        new: true,
      });

      if (!ticket) {
        return {
          success: false,
          message: "Ticket not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Ticket updated successfully",
        data: ticket,
      };
    } catch (error) {
      this.logger.error("Error updating ticket:", error);
      return {
        success: false,
        message: "Failed to update ticket",
        data: null,
      };
    }
  }

  public async assignTicket(
    ticketId: string,
    agentId: string
  ): Promise<ServiceResponse> {
    try {
      const ticket = await TicketModel.findById(ticketId);
      if (!ticket) {
        return {
          success: false,
          message: "Ticket not found",
          data: null,
        };
      }
      ticket.assignedTo = agentId;
      ticket.status = "IN_PROGRESS";
      await ticket.save();
      return {
        success: true,
        message: "Ticket assigned successfully",
        data: ticket,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to assign ticket",
        data: null,
      };
    }
  }
  private validateFileUpload(file: {
    mimeType: string;
    size: number;
  }): string | null {
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/jpg",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/x-flv",
      "video/webm",
      "video/3gpp",
      "video/3gpp2",
      "video/avi",
      "video/mpeg",
      "video/ogg",
      "video/x-matros",
      "video/mkv",
    ];
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      return "Invalid file type. Allowed types are: images and videos";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size too large. Maximum size is 50MB.";
    }

    return null;
  }
  private async uploadAttachment(
    ticketNo: string,
    file: IConversationRequest["attachment"]
  ): Promise<IConversationAttachment> {
    if (!file) throw new Error("No file provided");

    const validationError = this.validateFileUpload(file);
    if (validationError) {
      throw new Error(validationError);
    }

    try {
      // Generate unique filename
      const fileExtension = file.originalName.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      let fileData = file.file;

      if (!fileData) {
        fileData = fs.readFileSync(file.filePath);
      }
      // Upload to S3
      const uploadResult = await this.s3Service.uploadFile(
        `tickets/${ticketNo}/conversations`,
        fileName,
        fileData
      );

      // Return attachment metadata
      return {
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: this.s3Service.getObjectUrl(uploadResult.key),
        key: uploadResult.key,
      };
    } catch (error) {
      this.logger.error("Error uploading attachment:", error);
      throw new Error("Failed to upload attachment");
    }
  }

  public async addConversation(
    ticketId: string,
    conversation: IConversationRequest
  ): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const ticket = await TicketModel.findById(ticketId).session(session);

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      // Prepare conversation data
      const conversationData: any = {
        message: conversation.message,
        sender: conversation.sender,
        timestamp: new Date(),
      };

      // Handle attachment if present
      if (conversation.attachment) {
        try {
          conversationData.attachment = await this.uploadAttachment(
            ticket.ticketNo,
            conversation.attachment
          );
        } catch (error) {
          throw new Error(`Attachment upload failed: ${error.message}`);
        }
      }

      // Add conversation to ticket
      ticket.conversations.push(conversationData);
      await ticket.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        message: "Conversation added successfully",
        data: ticket,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error adding conversation:", error);
      return {
        success: false,
        message: error.message || "Failed to add conversation",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  public async getConversations(
    ticketId: string,
    timeRange?: {
      startTimestamp?: string;
      endTimestamp?: string;
    }
  ): Promise<ServiceResponse> {
    try {
      // First check if ticket exists
      const ticketExists = await TicketModel.exists({ _id: ticketId });
      if (!ticketExists) {
        return {
          success: false,
          message: "Ticket not found",
          data: null,
        };
      }

      const query: any = { _id: ticketId };
      const projection: any = {
        conversations: 1,
        ticketNo: 1,
      };

      // Build timestamp filter if provided
      if (timeRange) {
        const timeFilter: any = {};

        if (timeRange.startTimestamp) {
          timeFilter.$gt = new Date(timeRange.startTimestamp);
        }

        if (timeRange.endTimestamp) {
          timeFilter.$lt = new Date(timeRange.endTimestamp);
        }

        if (Object.keys(timeFilter).length > 0) {
          query["conversations.timestamp"] = timeFilter;
        }
      }

      const ticket = await TicketModel.findOne(query)
        // .populate({
        //   path: "conversations.sender",
        //   select: "name email role",
        // })
        .select(projection)
        .sort({ "conversations.timestamp": 1 });

      // Handle case where ticket exists but has no conversations
      if (!ticket?.conversations?.length) {
        return {
          success: true,
          message: "No conversations found for this ticket",
          data: {
            ticketNo: ticket?.ticketNo,
            conversations: [],
            timeRange: {
              start: timeRange?.startTimestamp
                ? new Date(timeRange.startTimestamp)
                : null,
              end: timeRange?.endTimestamp
                ? new Date(timeRange.endTimestamp)
                : null,
            },
            count: 0,
          },
        };
      }

      // Filter conversations if time range was provided
      let conversations = ticket.conversations;
      if (timeRange) {
        conversations = conversations.filter((conv) => {
          const timestamp = conv.timestamp.getTime();
          const isAfterStart =
            !timeRange.startTimestamp ||
            timestamp > new Date(timeRange.startTimestamp).getTime();
          const isBeforeEnd =
            !timeRange.endTimestamp ||
            timestamp < new Date(timeRange.endTimestamp).getTime();
          return isAfterStart && isBeforeEnd;
        });
      }

      return {
        success: true,
        message: conversations.length
          ? "Conversations retrieved successfully"
          : "No conversations found for the specified time range",
        data: {
          ticketNo: ticket.ticketNo,
          conversations,
          timeRange: {
            start: timeRange?.startTimestamp
              ? new Date(timeRange.startTimestamp)
              : null,
            end: timeRange?.endTimestamp
              ? new Date(timeRange.endTimestamp)
              : null,
          },
          count: conversations.length,
        },
      };
    } catch (error) {
      this.logger.error("Error retrieving conversations:", error);
      return {
        success: false,
        message: "Failed to retrieve conversations",
        data: null,
      };
    }
  }
  
  /**
   * Process HZPays payment notification callback
   */
  // public async processPaymentCallback(notificationData: any): Promise<ServiceResponse> {
  //   try {
  //     // Validate notification data first
  //     const validationResult = this.hzPaysService.validateNotification(notificationData);
  //     if (!validationResult.success) {
  //       return validationResult;
  //     }

  //     // Extract reference number from notification data
  //     const { reference, statusCode, amount, transactionId } = notificationData;
      
  //     // Find the associated ticket by reference in payment transaction id
  //     const ticket = await TicketModel.findOne({
  //       "transactionDetails.paymentTxnId": reference
  //     });

  //     if (!ticket) {
  //       return {
  //         success: false,
  //         message: "No ticket found with this reference",
  //         data: null
  //       };
  //     }

  //     // Update ticket based on payment status
  //     if (statusCode === "success") {
  //       // Update ticket with payment information
  //       ticket.transactionDetails.paymentTxnId = transactionId;
  //       ticket.transactionDetails.remarks = `Payment successful. TransactionID: ${transactionId}`;
  //       ticket.status = "IN_PROGRESS"; // Update status accordingly
        
  //       // Consider auto-crediting user's wallet here or flag for staff approval
        
  //       await ticket.save();
        
  //       return {
  //         success: true,
  //         message: "Payment completed successfully and ticket updated",
  //         data: ticket
  //       };
  //     } else {
  //       // Payment failed
  //       ticket.transactionDetails.remarks = `Payment failed. Reason: ${notificationData.failReason || "Unknown error"}`;
  //       await ticket.save();
        
  //       return {
  //         success: false,
  //         message: "Payment failed",
  //         data: ticket
  //       };
  //     }
  //   } catch (error) {
  //     this.logger.error("Error processing payment callback:", error);
  //     return {
  //       success: false,
  //       message: error.message || "Failed to process payment callback",
  //       data: null,
  //     };
  //   }
  // }

  /**
   * Process HZPays payout (withdrawal) notification callback
   */
  // public async processPayoutNotification(notificationData: any): Promise<ServiceResponse> {
  //   try {
  //     // Validate notification data through the service
  //     const validationResult = this.hzPaysService.validatePayoutNotification(notificationData);
  //     if (!validationResult.success) {
  //       return validationResult;
  //     }

  //     // Extract reference number and status from notification data
  //     const { reference, state, amount, realAmount, transactionId } = notificationData;
      
  //     // Find the associated ticket by reference in payment transaction id
  //     const ticket = await TicketModel.findOne({
  //       "transactionDetails.paymentTxnId": reference
  //     });

  //     if (!ticket) {
  //       return {
  //         success: false,
  //         message: "No ticket found with this reference",
  //         data: null
  //       };
  //     }

  //     // Update ticket based on payout status
  //     if (state === "success") {
  //       // Update ticket with payout information
  //       ticket.transactionDetails.paymentTxnId = transactionId;
  //       ticket.transactionDetails.remarks = `Withdrawal successful. TransactionID: ${transactionId}, Amount: ${realAmount}`;
  //       ticket.status = "CLOSED"; // Automatically close the ticket as the withdrawal was successful
        
  //       // Add a system conversation entry about the successful withdrawal
  //       ticket.conversations.push({
  //         message: `Withdrawal processed successfully. Amount: ${realAmount}, TransactionID: ${transactionId}`,
  //         sender: "system",
  //         timestamp: new Date(),

  //       });
        
  //       await ticket.save();
        
  //       return {
  //         success: true,
  //         message: "Withdrawal completed successfully and ticket updated",
  //         data: ticket
  //       };
  //     } else if (state === "waiting") {
  //       // Payout is still being processed
  //       ticket.transactionDetails.remarks = `Withdrawal in progress. TransactionID: ${transactionId}`;
        
  //       // Add a system conversation entry about the pending withdrawal
  //       ticket.conversations.push({
  //         message: `Withdrawal is being processed. Amount: ${amount}, TransactionID: ${transactionId}`,
  //         sender: "system",
  //         timestamp: new Date()
  //       });
        
  //       await ticket.save();
        
  //       return {
  //         success: true,
  //         message: "Withdrawal in progress",
  //         data: ticket
  //       };
  //     } else {
  //       // Withdrawal failed
  //       ticket.transactionDetails.remarks = `Withdrawal failed. Reason: ${notificationData.failReason || "Unknown error"}`;
  //       ticket.status = "OPEN"; // Reopen the ticket for staff intervention
        
  //       // Add a system conversation entry about the failed withdrawal
  //       ticket.conversations.push({
  //         message: `Withdrawal failed. Reason: ${notificationData.failReason || "Unknown error"}`,
  //         sender: "system",
  //         timestamp: new Date()
  //       });
        
  //       await ticket.save();
        
  //       return {
  //         success: false,
  //         message: "Withdrawal failed",
  //         data: ticket
  //       };
  //     }
  //   } catch (error) {
  //     this.logger.error("Error processing payout notification:", error);
  //     return {
  //       success: false,
  //       message: error.message || "Failed to process payout notification",
  //       data: null,
  //     };
  //   }
  // }
}
