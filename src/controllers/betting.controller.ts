// import { Service, Container } from "typedi";
// import { Response, Request, NextFunction } from "express";
// import { body } from "express-validator";
// import { Logger } from "winston";
// import HttpStatusCodes from "http-status-codes";

// import ResponseModel from "@models/response.model";
// import { sendErrorResponse } from "@utils/sendErrorResponse";
// import { BettingService } from "@services/betting.service";

// @Service()
// export class BettingController {
//   private logger: Logger = Container.get("logger");
//   private bettingService: BettingService = Container.get(BettingService);

//   public async placeBet(req: Request, res: Response, next: NextFunction): Promise<void> {
//     this.logger.info("<Betting Controller>: placeBet method : Processing");
//     try {
//       const betData = req.body;
//       const result = await this.bettingService.placeBet(betData);

//       if (result.success) {
//         const response = new ResponseModel(
//           result.data,
//           HttpStatusCodes.CREATED,
//           "Bet placed successfully"
//         );
//         res.status(HttpStatusCodes.CREATED).json(response.generate());
//       } else {
//         sendErrorResponse(
//           res,
//           HttpStatusCodes.BAD_REQUEST,
//           result.message ?? "Failed to place bet"
//         );
//       }
//     } catch (err) {
//       this.logger.error("Betting Controller: placeBet : Error", err);
//       next(err);
//     }
//   }

//   public async getBetById(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { id } = req.params;
//       const result = await this.bettingService.getBetById(id);

//       if (result.success) {
//         const response = new ResponseModel(
//           result.data,
//           HttpStatusCodes.OK,
//           "Bet retrieved successfully"
//         );
//         res.status(HttpStatusCodes.OK).json(response.generate());
//       } else {
//         sendErrorResponse(
//           res,
//           HttpStatusCodes.NOT_FOUND,
//           "Bet not found"
//         );
//       }
//     } catch (err) {
//       this.logger.error("Betting Controller: getBetById : Error", err);
//       next(err);
//     }
//   }

//   public async getBetsByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { userId } = req.params;
//       const result = await this.bettingService.getBetsByUserId(userId);

//       const response = new ResponseModel(
//         result,
//         HttpStatusCodes.OK,
//         "Bets retrieved successfully"
//       );
//       res.status(HttpStatusCodes.OK).json(response.generate());
//     } catch (err) {
//       this.logger.error("Betting Controller: getBetsByUserId : Error", err);
//       next(err);
//     }
//   }

//   public async cancelBet(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { betId } = req.params;
//       const result = await this.bettingService.cancelBet(betId);

//       if (result.success) {
//         const response = new ResponseModel(
//           result.data,
//           HttpStatusCodes.OK,
//           "Bet cancelled successfully"
//         );
//         res.status(HttpStatusCodes.OK).json(response.generate());
//       } else {
//         sendErrorResponse(
//           res,
//           HttpStatusCodes.BAD_REQUEST,
//           result.message ?? "Failed to cancel bet"
//         );
//       }
//     } catch (err) {
//       this.logger.error("Betting Controller: cancelBet : Error", err);
//       next(err);
//     }
//   }
//   public async getBetHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
//     this.logger.info("<Betting Controller>: getBetHistory method : Processing");
//     try {
//       const { userId } = req.params;
//       const { startDate, endDate, status } = req.query;

//       const result = await this.bettingService.getBetHistory(userId, {
//         startDate: startDate as string,
//         endDate: endDate as string,
//         status: status as string
//       });

//       if (result.success) {
//         const response = new ResponseModel(
//           result.data,
//           HttpStatusCodes.OK,
//           "Bet history retrieved successfully"
//         );
//         res.status(HttpStatusCodes.OK).json(response.generate());
//       } else {
//         sendErrorResponse(
//           res,
//           HttpStatusCodes.BAD_REQUEST,
//           result.message ?? "Failed to retrieve bet history"
//         );
//       }
//     } catch (err) {
//       this.logger.error("Betting Controller: getBetHistory : Error", err);
//       next(err);
//     }
//   }

//   public validate(method: string): any[] {
//     switch (method) {
//       case "placeBet":
//         return [
//           body("amount").exists().isNumeric().withMessage("Valid bet amount is required"),
//           body("odds").exists().isNumeric().withMessage("Valid odds are required"),
//           body("eventId").exists().isString().withMessage("Event ID is required"),
//           body("selectionId").exists().isString().withMessage("Selection ID is required")
//         ];
//       case "getBet":
//         return [
//           body("id").exists().isString().withMessage("Bet ID is required")
//         ];
//       case "getUserBets":
//         return [
//           body("userId").exists().isString().withMessage("User ID is required")
//         ];
//       case "cancelBet":
//         return [
//           body("betId").exists().isString().withMessage("Bet ID is required")
//         ];
//         case "getBetHistory":
//           return [
//             body("userId").exists().isString().withMessage("User ID is required"),
//             body("startDate").optional().isISO8601().withMessage("Start date must be a valid date"),
//             body("endDate").optional().isISO8601().withMessage("End date must be a valid date"),
//             body("status").optional().isIn(['PENDING', 'SETTLED', 'CANCELLED'])
//               .withMessage("Invalid bet status")
//           ];
//       default:
//         return [];
//     }
//   }
// }