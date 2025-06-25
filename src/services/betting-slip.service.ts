// import { Service, Container } from "typedi";
// import { Logger } from "winston";
// import { OddsService } from "./odds.service";
// import { ServiceResponse } from "@interfaces/service-response.interface";
// import { IBettingSlip, ListSlipsOptions, SelectionStatus } from "@interfaces/betting-slip.interface";
// import { BettingSlipModel } from "@models/betting-slip.model";

// @Service()
// export class BettingSlipService {
//   private logger: Logger = Container.get("logger");
//   private oddsService: OddsService = Container.get(OddsService);
//   // private userService: UserService = Container.get(UserService);

//   public async createSlip(userId: string, currency: string = "USD"): Promise<ServiceResponse> {
//     try {
//       const slip = await BettingSlipModel.create({
//         userId,
//         currency,
//         selections: [],
//         totalStake: 0,
//         potentialPayout: 0,
//         status: SelectionStatus.PENDING
//       });

//       return {
//         success: true,
//         message: "Betting slip created successfully",
//         data: slip
//       };
//     } catch (error) {
//       this.logger.error("Error creating betting slip:", error);
//       return {
//         success: false,
//         message: "Failed to create betting slip",
//         data: null
//       };
//     }
//   }

//   public async addSelection(
//     slipId: string, 
//     userId: string, 
//     selection: {
//       eventId: string;
//       marketId: string;
//       outcomeId: string;
//       odds: number;
//       stake: number;
//     }
//   ): Promise<ServiceResponse> {
//     try {
//       // Validate slip ownership
//       const slip = await this.getValidSlip(slipId, userId);
//       if (!slip) {
//         return {
//           success: false,
//           message: "Betting slip not found",
//           data: null
//         };
//       }

//       // Validate odds are still valid
//       const oddsValidation = await this.oddsService.validateOdds(
//         'prematch',
//         selection.eventId,
//         selection.marketId,
//         selection.outcomeId,
//         selection.odds
//       );

//       if (!oddsValidation.success) {
//         return {
//           success: false,
//           message: "Odds have changed",
//           data: oddsValidation.data
//         };
//       }

//       // Add selection
//       slip.selections.push({
//         ...selection,
//         status: SelectionStatus.PENDING,
//         addedAt: new Date()
//       });

//       // Update calculations
//       this.updateSlipCalculations(slip);
//       await slip.save();

//       return {
//         success: true,
//         message: "Selection added successfully",
//         data: slip
//       };
//     } catch (error) {
//       this.logger.error("Error adding selection:", error);
//       return {
//         success: false,
//         message: "Failed to add selection",
//         data: null
//       };
//     }
//   }

//   public async removeSelection(
//     slipId: string,
//     userId: string,
//     selectionId: string
//   ): Promise<ServiceResponse> {
//     try {
//       const slip = await this.getValidSlip(slipId, userId);
//       if (!slip) {
//         return {
//           success: false,
//           message: "Betting slip not found",
//           data: null
//         };
//       }

//       slip.selections = slip.selections.filter(s => s._id.toString() !== selectionId);
//       this.updateSlipCalculations(slip);
//       await slip.save();

//       return {
//         success: true,
//         message: "Selection removed successfully",
//         data: slip
//       };
//     } catch (error) {
//       this.logger.error("Error removing selection:", error);
//       return {
//         success: false,
//         message: "Failed to remove selection",
//         data: null
//       };
//     }
//   }

//   public async validateSlip(slipId: string, userId: string): Promise<ServiceResponse> {
//     try {
//       const slip = await this.getValidSlip(slipId, userId);
//       if (!slip) {
//         return {
//           success: false,
//           message: "Betting slip not found",
//           data: null
//         };
//       }

//       const validations = await Promise.all(
//         slip.selections.map(selection =>
//           this.oddsService.validateOdds(
//             'prematch',
//             selection.eventId,
//             selection.marketId,
//             selection.outcomeId,
//             selection.odds,
//           )
//         )
//       );

//       const invalidSelections = validations.filter(v => !v.success);

//       return {
//         success: invalidSelections.length === 0,
//         message: invalidSelections.length ? "Some selections are invalid" : "All selections are valid",
//         data: {
//           valid: invalidSelections.length === 0,
//           invalidSelections
//         }
//       };
//     } catch (error) {
//       this.logger.error("Error validating slip:", error);
//       return {
//         success: false,
//         message: "Failed to validate slip",
//         data: null
//       };
//     }
//   }

//   private async getValidSlip(slipId: string, userId: string): Promise<IBettingSlip | null> {
//     return BettingSlipModel.findOne({ _id: slipId, userId });
//   }

//   private updateSlipCalculations(slip: IBettingSlip): void {
//     slip.totalStake = slip.selections.reduce((sum, s) => sum + s.stake, 0);
//     slip.potentialPayout = slip.selections.length === 1
//       ? slip.selections[0].stake * slip.selections[0].odds
//       : slip.selections.reduce((acc, s) => acc * s.odds, slip.totalStake);
//   }

//   public async placeBet(slipId: string, userId: string): Promise<ServiceResponse> {
//     try {
//       // Get and validate slip
//       const slip = await this.getValidSlip(slipId, userId);
//       if (!slip) {
//         return {
//           success: false,
//           message: "Betting slip not found",
//           data: null
//         };
//       }

//       // Check if slip has selections
//       if (slip.selections.length === 0) {
//         return {
//           success: false,
//           message: "Cannot place bet with empty slip",
//           data: null
//         };
//       }

//       // Validate all selections before placing bet
//       const validationResult = await this.validateSlip(slipId, userId);
//       if (!validationResult.success) {
//         return {
//           success: false,
//           message: "Slip validation failed",
//           data: validationResult.data
//         };
//       }

//       // Update slip status
//       slip.status = SelectionStatus.PLACED;
//       slip.placedAt = new Date();

//       // Update each selection status
//       slip.selections = slip.selections.map(selection => ({
//         ...selection,
//         status: SelectionStatus.PLACED
//       }));

//       await slip.save();

//       return {
//         success: true,
//         message: "Bet placed successfully",
//         data: {
//           slip,
//           betDetails: {
//             totalStake: slip.totalStake,
//             potentialPayout: slip.potentialPayout,
//             placedAt: slip.placedAt,
//             selections: slip.selections.length
//           }
//         }
//       };
//     } catch (error) {
//       this.logger.error("Error placing bet:", error);
//       return {
//         success: false,
//         message: "Failed to place bet",
//         data: null
//       };
//     }
//   }

//   public async getSlip(slipId: string, userId: string): Promise<ServiceResponse> {
//     try {
//       const slip = await BettingSlipModel.findOne({ 
//         _id: slipId, 
//         userId 
//       }).populate({
//         path: 'selections',
//         select: '-__v'
//       });

//       if (!slip) {
//         return {
//           success: false,
//           message: "Betting slip not found",
//           data: null
//         };
//       }

//       // Format the response data
//       const formattedSlip = {
//         id: slip._id,
//         userId: slip.userId,
//         currency: slip.currency,
//         status: slip.status,
//         totalStake: slip.totalStake,
//         potentialPayout: slip.potentialPayout,
//         selections: slip.selections.map(selection => ({
//           id: selection._id,
//           eventId: selection.eventId,
//           marketId: selection.marketId,
//           outcomeId: selection.outcomeId,
//           odds: selection.odds,
//           stake: selection.stake,
//           status: selection.status,
//           addedAt: selection.addedAt
//         })),
//         createdAt: slip.createdAt,
//         updatedAt: slip.updatedAt,
//         placedAt: slip.placedAt
//       };

//       return {
//         success: true,
//         message: "Betting slip retrieved successfully",
//         data: formattedSlip
//       };
//     } catch (error) {
//       this.logger.error("Error retrieving slip:", error);
//       return {
//         success: false,
//         message: "Failed to retrieve betting slip",
//         data: null
//       };
//     }
//   }

//   public async listSlips(userId: string, options: ListSlipsOptions): Promise<ServiceResponse> {
//     try {
//       const query: any = { userId };

//       // Add filters
//       if (options.status) {
//         query.status = options.status;
//       }
      
//       if (options.fromDate || options.toDate) {
//         query.createdAt = {};
//         if (options.fromDate) {
//           query.createdAt.$gte = options.fromDate;
//         }
//         if (options.toDate) {
//           query.createdAt.$lte = options.toDate;
//         }
//       }

//       // Calculate skip value for pagination
//       const skip = (options.page - 1) * options.limit;

//       // Get total count for pagination
//       const total = await BettingSlipModel.countDocuments(query);

//       // Get slips with pagination
//       const slips = await BettingSlipModel.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(options.limit)
//         .lean();

//       return {
//         success: true,
//         message: 'Betting slips retrieved successfully',
//         data: {
//           slips,
//           pagination: {
//             total,
//             page: options.page,
//             limit: options.limit,
//             totalPages: Math.ceil(total / options.limit)
//           }
//         }
//       };
//     } catch (error) {
//       this.logger.error('Error listing betting slips:', error);
//       return {
//         success: false,
//         message: 'Failed to retrieve betting slips',
//         data: null
//       };
//     }
//   }

// }