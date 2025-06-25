// import { Service, Container } from 'typedi';
// import { Logger } from 'winston';

// import { IBetHistoryFilters, IPlaceBetRequest } from '@interfaces/bet.interface';
// import { ServiceResponse } from '@interfaces/service-response.interface';

// import { BetModel } from '@models/bet.model';

// @Service()
// export class BettingService {
//   private logger: Logger = Container.get('logger');

//   public async placeBet(betData: IPlaceBetRequest): Promise<ServiceResponse> {
//     try {
//       this.logger.info('BettingService - Placing bet');

//       // Validate bet amount and odds
//       if (!this.isValidBetAmount(betData.amount)) {
//         return {
//           success: false,
//           message: 'Invalid bet amount',
//           data: null
//         };
//       }

//       // Create bet record
//       const bet = await BetModel.create({
//         ...betData,
//         status: 'PENDING',
//         createdAt: new Date()
//       });

//       return {
//         success: true,
//         message: 'Bet placed successfully',
//         data: bet
//       };
//     } catch (error) {
//       this.logger.error('Error in placeBet:', error);
//       return {
//         success: false,
//         message: 'Failed to place bet',
//         data: null
//       };
//     }
//   }

//   public async getBetById(betId: string): Promise<ServiceResponse> {
//     try {
//       this.logger.info(`BettingService - Fetching bet: ${betId}`);
      
//       const bet = await BetModel.findById(betId);
      
//       if (!bet) {
//         return {
//           success: false,
//           message: 'Bet not found',
//           data: null
//         };
//       }

//       return {
//         success: true,
//         message: 'Bet retrieved successfully',
//         data: bet
//       };
//     } catch (error) {
//       this.logger.error('Error in getBetById:', error);
//       return {
//         success: false,
//         message: 'Failed to retrieve bet',
//         data: null
//       };
//     }
//   }

//   public async getBetsByUserId(userId: string): Promise<ServiceResponse> {
//     try {
//       this.logger.info(`BettingService - Fetching bets for user: ${userId}`);
      
//       const bets = await BetModel.find({ userId });

//       return {
//         success: true,
//         message: 'Bets retrieved successfully',
//         data: bets
//       };
//     } catch (error) {
//       this.logger.error('Error in getBetsByUserId:', error);
//       return {
//         success: false,
//         message: 'Failed to retrieve bets',
//         data: null
//       };
//     }
//   }

//   public async getBetHistory(userId: string, filters: IBetHistoryFilters): Promise<ServiceResponse> {
//     try {
//       this.logger.info(`BettingService - Fetching bet history for user: ${userId}`);
      
//       // Build query filters
//       const query: any = { userId };
      
//       if (filters.startDate || filters.endDate) {
//         query.createdAt = {};
//         if (filters.startDate) {
//           query.createdAt.$gte = new Date(filters.startDate);
//         }
//         if (filters.endDate) {
//           query.createdAt.$lte = new Date(filters.endDate);
//         }
//       }
      
//       if (filters.status) {
//         query.status = filters.status;
//       }
  
//       // Fetch bets with filters
//       const bets = await BetModel.find(query)
//         .sort({ createdAt: -1 }) // Sort by newest first
//         .lean();
  
//       // Calculate statistics
//       const statistics = {
//         totalBets: bets.length,
//         totalAmount: bets.reduce((sum, bet) => sum + bet.amount, 0),
//         wonBets: bets.filter(bet => bet.status === 'WON').length,
//         lostBets: bets.filter(bet => bet.status === 'LOST').length,
//         pendingBets: bets.filter(bet => bet.status === 'PENDING').length
//       };
  
//       return {
//         success: true,
//         message: 'Bet history retrieved successfully',
//         data: {
//           bets,
//           statistics
//         }
//       };
//     } catch (error) {
//       this.logger.error('Error in getBetHistory:', error);
//       return {
//         success: false,
//         message: 'Failed to retrieve bet history',
//         data: null
//       };
//     }
//   }

//   public async cancelBet(betId: string): Promise<ServiceResponse> {
//     try {
//       this.logger.info(`BettingService - Cancelling bet: ${betId}`);
      
//       const bet = await BetModel.findById(betId);
      
//       if (!bet) {
//         return {
//           success: false,
//           message: 'Bet not found',
//           data: null
//         };
//       }

//       if (bet.status !== 'PENDING') {
//         return {
//           success: false,
//           message: 'Bet cannot be cancelled',
//           data: null
//         };
//       }

//       const updatedBet = await BetModel.findByIdAndUpdate(
//         betId,
//         { status: 'CANCELLED' },
//         { new: true }
//       );

//       return {
//         success: true,
//         message: 'Bet cancelled successfully',
//         data: updatedBet
//       };
//     } catch (error) {
//       this.logger.error('Error in cancelBet:', error);
//       return {
//         success: false,
//         message: 'Failed to cancel bet',
//         data: null
//       };
//     }
//   }

//   private isValidBetAmount(amount: number): boolean {
//     return amount > 0 && amount <= 10000; // Example validation
//   }
// }