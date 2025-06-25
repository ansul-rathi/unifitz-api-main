// import { Service, Container } from "typedi";
// import { Request, Response, NextFunction } from "express";
// import HttpStatusCodes from "http-status-codes";
// import ResponseModel from "@models/response.model";
// import { HZPaysService } from "@services/hzpays.service";
// import { TicketService } from "@services/ticket.service";
// import { IRequest } from "@interfaces/express.interface";
// import { Logger } from "winston";
// import { HZPaysPayoutOrderCreateRequest } from "@interfaces/hzpays.interface";

// @Service()
// export class HZPaysController {
//   private hzPaysService: HZPaysService = Container.get(HZPaysService);
//   private ticketService: TicketService = Container.get(TicketService);
//   private logger: Logger = Container.get("logger");

//   /**
//    * Handle payment callback from HZPays
//    * This endpoint processes notifications from HZPays about payment status
//    */
//   public async handlePaymentCallback(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       this.logger.info("HZPays payment callback received:", req.body);
      
//       // Process the notification through the ticket service
//       const result = await this.ticketService.processPaymentCallback(req.body);
      
//       // Always respond with 200 OK to the payment provider
//       // This prevents them from retrying the callback unnecessarily
//       res.status(HttpStatusCodes.OK).json({
//         success: result.success,
//         message: result.message
//       });
//     } catch (error) {
//       this.logger.error("Error processing HZPays callback:", error);
//       // Still return 200 OK to prevent retries, but with error info
//       res.status(HttpStatusCodes.OK).json({
//         success: false,
//         message: "Error processing payment callback"
//       });
//     }
//   }

//   /**
//    * Create a payment order directly (for testing or direct API usage)
//    */
//   public async createPayment(
//     req: IRequest,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const {
//         amount,
//         customerName,
//         customerEmail,
//         customerPhone,
//         payMethod,
//         currency
//       } = req.body;

//       // Generate reference number using userId
//       const reference = this.hzPaysService.generateReferenceNumber(req.user.id);

//       const result = await this.hzPaysService.createPaymentOrder({
//         reference,
//         amount,
//         customerName,
//         customerEmail,
//         customerPhone,
//         payMethod,
//         currency
//       });

//       if (result.success) {
//         res
//           .status(HttpStatusCodes.OK)
//           .json(
//             new ResponseModel(
//               result.data,
//               HttpStatusCodes.OK,
//               result.message
//             ).generate()
//           );
//       } else {
//         res
//           .status(HttpStatusCodes.BAD_REQUEST)
//           .json(
//             new ResponseModel(
//               null,
//               HttpStatusCodes.BAD_REQUEST,
//               result.message
//             ).generate()
//           );
//       }
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Query payment status
//    */
//   public async queryPaymentStatus(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const { reference } = req.params;

//       const result = await this.hzPaysService.queryPaymentOrder(reference);

//       if (result.success) {
//         res
//           .status(HttpStatusCodes.OK)
//           .json(
//             new ResponseModel(
//               result.data,
//               HttpStatusCodes.OK,
//               result.message
//             ).generate()
//           );
//       } else {
//         res
//           .status(HttpStatusCodes.BAD_REQUEST)
//           .json(
//             new ResponseModel(
//               null,
//               HttpStatusCodes.BAD_REQUEST,
//               result.message
//             ).generate()
//           );
//       }
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Query account balance at HZPays
//    * Allows checking the merchant's account balance at the payment provider
//    */
//   public async queryAccountBalance(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       this.logger.info("Querying HZPays account balance");
      
//       const result = await this.hzPaysService.queryAccountBalance();

//       if (result.success) {
//         res
//           .status(HttpStatusCodes.OK)
//           .json(
//             new ResponseModel(
//               result.data,
//               HttpStatusCodes.OK,
//               result.message
//             ).generate()
//           );
//       } else {
//         res
//           .status(HttpStatusCodes.BAD_REQUEST)
//           .json(
//             new ResponseModel(
//               null,
//               HttpStatusCodes.BAD_REQUEST,
//               result.message
//             ).generate()
//           );
//       }
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Handle payment result notification from HZPays
//    * This endpoint processes payout transaction notifications
//    */
//   public async handlePayoutNotification(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       this.logger.info("HZPays payout notification received:", req.body);
      
//       // Validate the notification via HZPays service
//       const validationResult = await this.hzPaysService.validatePayoutNotification(req.body);
      
//       if (!validationResult.success) {
//         this.logger.error("Invalid HZPays payout notification:", validationResult.message);
        
//         // Return 200 OK to prevent retries, but with error info
//         res.status(HttpStatusCodes.OK).json({
//           success: false,
//           message: validationResult.message
//         });
//         return;
//       }
      
//       // Process the validated notification 
//       const result = await this.ticketService.processPayoutNotification(req.body);
      
//       // Always respond with 200 OK to the payment provider
//       res.status(HttpStatusCodes.OK).json({
//         success: result.success,
//         message: result.message
//       });
//     } catch (error) {
//       this.logger.error("Error processing HZPays payout notification:", error);
//       // Still return 200 OK to prevent retries, but with error info
//       res.status(HttpStatusCodes.OK).json({
//         success: false,
//         message: "Error processing payout notification"
//       });
//     }
//   }

//   /**
//    * Create a payout (withdrawal) order
//    */
//   public async createPayoutOrder(
//     req: IRequest,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const {
//         amount,
//         bankCode,
//         name,
//         accountNumber,
//         currency,
//         email,
//         phone,
//         province,
//         accountType,
//         transferType
//       } = req.body;

//       // Generate reference number using userId
//       const reference = this.hzPaysService.generateReferenceNumber(req.user.id);

//       const payoutParams: HZPaysPayoutOrderCreateRequest = {
//         merchantId: '',  // Will be filled by service
//         eventType: 'payout.order.create',
//         reference,
//         amount,
//         currency: currency || 'INR',
//         bankCode,
//         name,
//         accountNumber,
//         notifyUrl: '',  // Will be filled by service
//         sign: '',       // Will be filled by service
//       };
      
//       // Add optional parameters if provided
//       if (email) payoutParams.email = email;
//       if (phone) payoutParams.phone = phone;
//       if (province) payoutParams.province = province;
//       if (accountType) payoutParams.accountType = accountType;
//       if (transferType) payoutParams.transferType = transferType;

//       const result = await this.hzPaysService.createPayoutOrder(payoutParams);

//       if (result.success) {
//         res
//           .status(HttpStatusCodes.OK)
//           .json(
//             new ResponseModel(
//               result.data,
//               HttpStatusCodes.OK,
//               result.message
//             ).generate()
//           );
//       } else {
//         res
//           .status(HttpStatusCodes.BAD_REQUEST)
//           .json(
//             new ResponseModel(
//               null,
//               HttpStatusCodes.BAD_REQUEST,
//               result.message
//             ).generate()
//           );
//       }
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Query payout order status
//    */
//   public async queryPayoutStatus(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> {
//     try {
//       const { reference } = req.params;

//       const result = await this.hzPaysService.queryPayoutOrder(reference);

//       if (result.success) {
//         res
//           .status(HttpStatusCodes.OK)
//           .json(
//             new ResponseModel(
//               result.data,
//               HttpStatusCodes.OK,
//               result.message
//             ).generate()
//           );
//       } else {
//         res
//           .status(HttpStatusCodes.BAD_REQUEST)
//           .json(
//             new ResponseModel(
//               null,
//               HttpStatusCodes.BAD_REQUEST,
//               result.message
//             ).generate()
//           );
//       }
//     } catch (error) {
//       next(error);
//     }
//   }
// }