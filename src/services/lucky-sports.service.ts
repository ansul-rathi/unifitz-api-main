import { Service } from "typedi";
import axios from "axios";
import { Logger } from "winston";
import { Container } from "typedi";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { luckySportsConfig } from "@config/constants";
import cacheUtil from "@utils/cache";
import { UserModel } from "@models/user.model";
import mongoose from "mongoose";
import { WalletService } from "./wallet.service";
import { BetOrderModel, BetOrderStatus } from "@models/bet-order.model";
import {
  IBetRequest,
  IBonusPayoutRequest,
  IExchangeBetRequest,
  IExchangeSettlementRequest,
  IRollbackRequest,
  ISettlementRequest,
} from "@interfaces/bet.interface";
import { convertToCents } from "@utils/index";
import { IMakeBetResponse, ISettelmentResponse, ITradeListParams } from "@interfaces/luckysports.interface";

const axiosClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  params: {
    key: luckySportsConfig.apiKey,
  },
});
@Service()
export class LuckySportsService {
  private logger: Logger = Container.get("logger");
  private walletService: WalletService = Container.get(WalletService);

  private urls = {
    GET_ID_TOKEN: "https://mtauth.uni247.xyz/GetIDToken",
    CREATE_MEMBER: "https://api.uni247.xyz/api/auth/merchant/create-member",
    GET_GUEST_TOKEN: "https://api.uni247.xyz/api/auth/merchant/guest-token",
    LOGIN_MEMBER: "https://api.uni247.xyz/api/auth/merchant/login-v2",
    LIST_TRADES: "https://api.uni247.xyz/api/order/merchant/list-trades",
  };

  // private queryParams = new URLSearchParams({
  //   key: luckySportsConfig.apiKey,
  // });

  public async getIDToken(): Promise<ServiceResponse> {
    const cacheKey = "luckySportsIdToken";
    try {
      const cachedToken = cacheUtil.get(cacheKey);

      if (cachedToken) {
        this.logger.info("<Lucky sports Service>: used cached id token");
        console.log("used cached id token");
        return {
          success: true,
          message: "ID token retrieved from cache",
          data: cachedToken,
        };
      }

      const apiUrl = `${this.urls.GET_ID_TOKEN}`;

      const response = await axiosClient.post(
        apiUrl,
        {
          email: luckySportsConfig.email,
          password: luckySportsConfig.password,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const { expiresIn } = response.data;
        const ttl = parseInt(expiresIn, 10);
        cacheUtil.set(cacheKey, response.data, ttl);
        console.log("set cached id token");

        return {
          success: true,
          message: "ID token retrieved successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: "Failed to retrieve ID token",
          data: null,
        };
      }
    } catch (error) {
      this.logger.error("Error in getIDToken:", error?.response?.data || error?.response || error);
    return {
        success: false,
        message: "Failed to retrieve ID token",
        data: null,
      };
    }
  }

  public async getGuestToken(): Promise<ServiceResponse> {
    try {
      const apiUrl = `${this.urls.GET_GUEST_TOKEN}`;

      const idToken = await this.getMerchantToken();
      if (!idToken) {
        return {
          success: false,
          message: "Failed to retrieve merchant token",
          data: null,
        };
      }
      const response = await axiosClient.post(
        apiUrl,
        {},
        {
          headers: {
            authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: "Guest token retrieved successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: "Failed to retrieve guest token",
          data: null,
        };
      }
    } catch (error) {
      this.logger.error("Error in getGuestToken:", error);
      return {
        success: false,
        message: "Failed to retrieve guest token",
        data: null,
      };
    }
  }

  public async createMember(userId: string): Promise<ServiceResponse> {
    try {
      // const userExists = await UserModel.findById(userId);
      // if ()
      const apiUrl = `${this.urls.CREATE_MEMBER}`;

      const idToken = await this.getMerchantToken();

      if (!idToken) {
        return {
          success: false,
          message: "Failed to retrieve merchant token",
          data: null,
        };
      }

      const response = await axiosClient.post(
        apiUrl,
        {
          player_id: userId,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 200) {
        await UserModel.findByIdAndUpdate(userId, {
          luckySportUserId: response.data?.User?.user_id,
          luckySportPlayerId: response.data?.User?.player_id,
        });
        return {
          success: true,
          message: "Member created successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: "Failed to create member : " + response.data.error,
          data: null,
        };
      }
    } catch (error) {
      this.logger.error("Error in createMember:", error);
      return {
        success: false,
        message: "Failed to create member: " + error?.response?.data?.error,
        data: null,
      };
    }
  }

  public async loginMember(playerId: string): Promise<ServiceResponse> {
    try {
      const apiUrl = `${this.urls.LOGIN_MEMBER}`;
      const idTokenData = await this.getIDToken();
      if (!idTokenData.success) {
        return {
          success: false,
          message: "Failed to retrieve ID token",
          data: null,
        };
      }
      const idToken = idTokenData.data.idToken;
      const response = await axiosClient.post(
        apiUrl,
        {
          player_id: playerId,
          language: "en",
        },
        {
          headers: {
            authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: "Member logged in successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: "Failed to login member",
          data: null,
        };
      }
    } catch (error) {
      this.logger.error("Error in loginMember:", error);
      return {
        success: false,
        message: "Failed to login member",
        data: null,
      };
    }
  }

  private async getMerchantToken(): Promise<string | null> {
    const idTokenData = await this.getIDToken();
    if (!idTokenData.success) {
      return null;
    }
    const idToken = idTokenData.data.idToken;
    return idToken;
  }


  public async listTrades(params: ITradeListParams): Promise<ServiceResponse> {
    try {
      const idToken = await this.getMerchantToken();
      if (!idToken) {
        throw new Error("Failed to retrieve merchant token");
      }
  
      const queryParams = new URLSearchParams({
        key: luckySportsConfig.apiKey,
        ...(params.market_type && { market_type: params.market_type }),
        ...(params.order_status && { order_status: params.order_status }),
        ...(params.event_type_ids && { event_type_ids: params.event_type_ids }),
        ...(params.trade_ids && { trade_ids: params.trade_ids }),
        ...(params.update_date_dt_range_start && { 
          update_date_dt_range_start: params.update_date_dt_range_start 
        }),
        ...(params.update_date_dt_range_end && { 
          update_date_dt_range_end: params.update_date_dt_range_end 
        }),
        ...(params.re_settle !== undefined && { 
          re_settle: params.re_settle.toString()
        }),
        ...(params.user_ids && { user_ids: params.user_ids }),
        ...(params.player_ids && { player_ids: params.player_ids }),
        ...(params.event_ids && { event_ids: params.event_ids }),
        ...(params.market_ids && { market_ids: params.market_ids }),
        ...(params.place_order_ids && { place_order_ids: params.place_order_ids }),
        ...(params.record_count && { 
          record_count: Math.min(params.record_count, 1000).toString() 
        }),
        ...(params.page && { page: params.page.toString() })
      });
  
      const response = await axiosClient.get<any>(
        `${this.urls.LIST_TRADES}?${queryParams.toString()}`,
        {
          headers: {
            accept: "application/json",
            authorization: `Bearer ${idToken}`
          }
        }
      );
  
      return {
        success: true,
        message: "Trades retrieved successfully",
        data: response.data
      };
    } catch (error) {
      this.logger.error("Error in listTrades:", error);
      return {
        success: false,
        message: error.message || "Failed to retrieve trades",
        data: null
      };
    }
  }
  /**
   * Place a sportsbook bet.
   * @param data - The bet data.
   * @returns A service response object with a boolean success flag, a message and data.
   * The data object contains the external transaction ID, the user's balance, the currency, the betslip ID and a timestamp.
   */
  public async placeSportsbookBet(data: IBetRequest): Promise<IMakeBetResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user by ext_player_id
      const user = await UserModel.findOne({
        luckySportPlayerId: data.transaction.ext_player_id,
      }).populate("wallet");

      if (!user || !user.wallet) {
        throw new Error("User wallet not found");
      }

      // Convert amount from cents to actual value
      const amount = data.transaction.amount / 100;

      // Deduct amount from wallet
      const debitResult = await this.walletService.processTransaction({
        walletId: user.wallet._id,
        amount,
        type: "DEBIT",
        category: "BET",
        status: 'COMPLETED',
        reference: data.transaction.id,
        metadata: {
          betslipId: data.transaction.betslip_id,
          description: "Sportsbook bet placement",
          operation: data.transaction.operation,
          luckySportUserId: data.transaction.player_id,
          operatorId: data.transaction.operator_id,
          operatorBrandId: data.transaction.operator_brand_id,
          bets: data.betslip.bets,
        },
      });

      if (!debitResult.success) {
        throw new Error(debitResult.message);
      }

      // Create bet order
      await BetOrderModel.create({
        userId: user._id,
        luckySportUserId: data.transaction.player_id,
        betslipId: data.betslip.id,
        transactionId: data.transaction.id,
        status: BetOrderStatus.OPEN,
        orderType: "SPORTSBOOK",
        amount,
        potentialWin: data.potential_win / 100, // Convert from cents
        currency: data.transaction.currency,
        odds: data.betslip.k,
        bets: data.betslip.bets.map((bet) => ({
          id: bet.id || bet.event_id,
          eventId: bet.event_id,
          marketId: bet.market_id,
          marketName: bet.market_name,
          outcomeName: bet.outcome_name,
          odds: bet.odds,
          competitors: bet.competitor_name,
          scheduled: new Date(bet.scheduled),
          sportId: bet.sport_id,
          tournamentId: bet.tournament_id,
          live: bet.live,
        })),
        operatorId: data.transaction.operator_id,
        operatorBrandId: data.transaction.operator_brand_id,
        metadata: {
          operation: data.transaction.operation,
        }
      });

      await session.commitTransaction();
      return {
        success: true,
        message: "Bet placed successfully",
        data: {
          id: data.transaction.id,
          ext_transaction_id: data.transaction.id,
          user_id: data.transaction.ext_player_id,
          operation: data.transaction.operation,
          amount: data.transaction.amount,
          currency: data.transaction.currency,
          balance: convertToCents(debitResult.data.balance) , // Convert to cents
        },
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in placeSportsbookBet:", error);
      return {
        success: false,
        message: error.message || "Failed to place bet",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Place an exchange bet.
   *
   * @param {IExchangeBetRequest} data Bet request data
   * @returns {Promise<ServiceResponse>} Service response
   */
  public async placeExchangeBet(
    data: IExchangeBetRequest
  ): Promise<IMakeBetResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user by ext_player_id
      const user = await UserModel.findOne({
        luckySportPlayerId: data.transaction.ext_player_id,
      }).populate("wallet");

      if (!user || !user.wallet) {
        throw new Error("User wallet not found");
      }

      // Convert amount from cents to actual value
      const amount = data.transaction.amount / 100;

      // Deduct amount from wallet
      const debitResult = await this.walletService.processTransaction({
        walletId: user.wallet._id,
        amount,
        type: "DEBIT",
        status: 'COMPLETED',
        category: "EXCHANGE_BET",
        reference: data.transaction.id,
        metadata: {
          betslipId: data.transaction.betslip_id,
          betId: data.betslip.bets[0].id,
          description: "Exchange bet placement",
          luckySportUserId: data.transaction.player_id,
          operation: data.transaction.operation,
          operatorId: data.transaction.operator_id,
          operatorBrandId: data.transaction.operator_brand_id,
          bet: data.betslip.bets[0],
        },
      });

      if (!debitResult.success) {
        throw new Error(debitResult.message);
      }

      // Create exchange bet order
      const bet = data.betslip.bets[0]; // Exchange always has one bet per order
      await BetOrderModel.create({
        userId: user._id,
        luckySportUserId: data.transaction.player_id,
        betslipId: data.betslip.id,
        betId: bet.id,
        status: BetOrderStatus.OPEN,
        transactionId: data.transaction.id,
        orderType: "EXCHANGE",
        betType: bet.backlay === "b" ? "BACK" : "LAY",
        amount,
        potentialWin: data.potential_win / 100, // Convert from cents
        currency: data.transaction.currency,
        odds: data.betslip.k,
        bets: [
          {
            id: bet.id,
            eventId: bet.event_id,
            marketId: bet.market_id,
            marketName: bet.market_name,
            outcomeName: bet.outcome_name,
            odds: bet.odds,
            competitors: bet.competitor_name,
            scheduled: new Date(bet.scheduled),
            sportId: bet.sport_id,
            tournamentId: bet.tournament_id,
            live: bet.live,
            backlay: bet.backlay,
          },
        ],
        metadata: {
          operation: data.transaction.operation,
        },
        operatorId: data.transaction.operator_id,
        operatorBrandId: data.transaction.operator_brand_id,
      });

      await session.commitTransaction();
      return {
        success: true,
        message: "Exchange bet placed successfully",
        data: {
          id: data.transaction.id,
          ext_transaction_id: data.transaction.id,
          user_id: data.transaction.ext_player_id,
          operation: data.transaction.operation,
          amount: data.transaction.amount,
          balance: convertToCents(debitResult.data.balance), // Convert to cents
          currency: data.transaction.currency,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in placeExchangeBet:", error);
      return {
        success: false,
        message: error.message || "Failed to place exchange bet",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  public async settleSportsbookWin(
    data: ISettlementRequest
  ): Promise<ISettelmentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user by ext_player_id
      const user = await UserModel.findOne({
        luckySportPlayerId: data.transaction.ext_player_id,
      }).populate("wallet");

      if (!user || !user.wallet) {
        throw new Error("User wallet not found");
      }

      // Find the bet order
      const betOrder = await BetOrderModel.findOne({
        betslipId: data.bet_slip_settle.bet_slip_id,
      });

      if (!betOrder) {
        throw new Error("Bet order not found");
      }

      if (!data.is_payout) {
        // First request - Update bet status
        await BetOrderModel.findByIdAndUpdate(betOrder._id, {
          status: BetOrderStatus.WIN,
          settledAt: new Date(),
          settlementAmount: Math.abs(data.transaction.amount) / 100, // Convert from cents
          metadata: {
            isCashout: data.is_cashout,
            commission: data.bet_slip_settle.commission,
            operation: data.transaction.operation,
            tradeProfit: data.bet_slip_settle.trade_profit,
            selections: data.selections,
          },
        });

        return {
          success: true,
          message: "Bet status updated successfully",
          data: {
            id: data.transaction.id,
            ext_transaction_id: data.transaction.id,
            user_id: data.transaction.ext_player_id,
            operation: data.transaction.operation,
            amount: data.transaction.amount,
            balance: convertToCents(user.wallet.balance) , // Convert to cents
          },
        };
      } else {
        // Second request - Process payout
        const amount = Math.abs(data.transaction.amount) / 100; // Convert from cents

        const creditResult = await this.walletService.processTransaction({
          walletId: user.wallet._id,
          amount,
          type: "CREDIT",
          status: 'COMPLETED',
          category: "WINNINGS",
          reference: data.transaction.id,
          metadata: {
            betslipId: data.bet_slip_settle.bet_slip_id,
            betId: data.selections.bet_id,
            operation: data.transaction.operation,
            description: data.is_cashout
              ? "Cashout settlement"
              : "Bet win settlement",
            profit: data.selections.profit,
            commission: data.bet_slip_settle.commission,
            tradeProfit: data.bet_slip_settle.trade_profit,
            luckySportUserId: data.transaction.player_id,
          },
        });

        if (!creditResult.success) {
          throw new Error(creditResult.message);
        }

        await session.commitTransaction();
        return {
          success: true,
          message: "Win payout processed successfully",
          data: {
            id: data.transaction.id,
            ext_transaction_id: data.transaction.id,
            user_id: data.transaction.ext_player_id,
            operation: data.transaction.operation,
            amount: data.transaction.amount,
            balance: convertToCents(creditResult.data.balance) , // Convert to cents
          },
        };
      }
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in settleSportsbookWin:", error);
      return {
        success: false,
        message: error.message || "Failed to process settlement",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }
  public async settleSportsbookLoss(
    data: ISettlementRequest
  ): Promise<ISettelmentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user by ext_player_id
      const user = await UserModel.findOne({
        luckySportPlayerId: data.transaction.ext_player_id,
      }).populate("wallet");

      if (!user || !user.wallet) {
        throw new Error("User wallet not found");
      }

      // Find the bet order
      const betOrder = await BetOrderModel.findOne({
        betslipId: data.bet_slip_settle.bet_slip_id,
      });

      if (!betOrder) {
        throw new Error("Bet order not found");
      }

      if (!data.is_payout) {
        // First request - Update bet status
        await BetOrderModel.findByIdAndUpdate(betOrder._id, {
          status: BetOrderStatus.LOST,
          settledAt: new Date(),
          metadata: {
            commission: data.bet_slip_settle.commission,
            tradeProfit: data.bet_slip_settle.trade_profit,
            selections: {
              betId: data.selections.bet_id,
              betslipId: data.selections.betslip_id,
              operation: data.transaction.operation,
              profit: data.selections.profit,
              status: data.selections.status,
            },
          },
        });

        return {
          success: true,
          message: "Bet status updated successfully",
          data: {
            id: data.transaction.id,
            ext_transaction_id: data.transaction.id,
            user_id: data.transaction.ext_player_id,
            operation: data.transaction.operation,
            amount: data.transaction.amount,
            balance:convertToCents(user.wallet.balance) , // Convert to cents
          },
        };
      } else {
        // Second request - Confirm loss settlement
        // Note: For losses, typically no balance changes are needed as money was deducted during bet placement
        await BetOrderModel.findByIdAndUpdate(betOrder._id, {
          finalizedAt: new Date(),
          metadata: {
            ...betOrder.metadata,
            commission: data.bet_slip_settle.commission,
            operation: data.transaction.operation,
            tradeProfit: data.bet_slip_settle.trade_profit,
            finalProfit: data.selections.profit,
          },
        });

        // Create a transaction record for the loss (optional, for record-keeping)
        const transactionResult = await this.walletService.processTransaction({
          walletId: user.wallet._id,
          amount: 0, // No balance change for losses
          type: "DEBIT",
          status: 'COMPLETED',
          category: "BET_SETTLEMENT",
          reference: data.transaction.id,
          metadata: {
            betslipId: data.bet_slip_settle.bet_slip_id,
            betId: data.selections.bet_id,
            description: "Bet loss settlement",
            operation: data.transaction.operation,
            profit: data.selections.profit,
            commission: data.bet_slip_settle.commission,
            tradeProfit: data.bet_slip_settle.trade_profit,
            luckySportUserId: data.transaction.player_id,
          },
        });

        if (!transactionResult.success) {
          throw new Error(transactionResult.message);
        }

        await session.commitTransaction();
        return {
          success: true,
          message: "Loss settlement processed successfully",
          data: {
            id: data.transaction.id,
            ext_transaction_id: data.transaction.id,
            user_id: data.transaction.ext_player_id,
            operation: data.transaction.operation,
            amount: data.transaction.amount,
            balance: convertToCents(user.wallet.balance) , // Convert to cents
          },
        };
      }
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in settleSportsbookLoss:", error);
      return {
        success: false,
        message: error.message || "Failed to process loss settlement",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  public async settleExchangeBet(
    data: IExchangeSettlementRequest
  ): Promise<ISettelmentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user by ext_player_id
      const user = await UserModel.findOne({
        luckySportPlayerId: data.transaction.ext_player_id,
      }).populate("wallet");

      if (!user || !user.wallet) {
        throw new Error("User wallet not found");
      }

      // Process each selection in the batch
      for (const selection of data.selections) {
        // Find and update bet order
        const betOrder = await BetOrderModel.findOne({
          betId: selection.bet_id,
          betslipId: selection.betslip_id,
        });

        if (!betOrder) {
          throw new Error(
            `Bet order not found for bet ID: ${selection.bet_id}`
          );
        }

        // Update bet order status
        await BetOrderModel.findByIdAndUpdate(betOrder._id, {
          status: selection.status.toUpperCase(),
          settledAt: new Date(),
          metadata: {
            commission: data.bet_slip_settle.commission,
            tradeProfit: data.bet_slip_settle.trade_profit,
            operation: data.transaction.operation,
            profit: selection.profit,
            finalStatus: selection.status,
          },
        });
      }

      // Process payout if there's a balance change
      if (data.transaction.amount !== 0) {
        const amount = Math.abs(data.transaction.amount) / 100; // Convert from cents
        const isCredit = data.transaction.amount < 0; // Negative amount means credit (win)

        const transactionResult = await this.walletService.processTransaction({
          walletId: user.wallet._id,
          amount,
          status: 'COMPLETED',
          type: isCredit ? "CREDIT" : "DEBIT",
          category: "EXCHANGE_SETTLEMENT",
          reference: data.transaction.id,
          metadata: {
            betslipId: data.bet_slip_settle.bet_slip_id,
            description: "Exchange bet settlement",
            operation: data.transaction.operation,
            commission: data.bet_slip_settle.commission,
            tradeProfit: data.bet_slip_settle.trade_profit,
            luckySportUserId: data.transaction.player_id,
            selections: data.selections,
          },
        });

        if (!transactionResult.success) {
          throw new Error(transactionResult.message);
        }

        await session.commitTransaction();
        return {
          success: true,
          message: "Exchange settlement processed successfully",
          data: {
            id: data.transaction.id,
            ext_transaction_id: data.transaction.id,
            user_id: data.transaction.ext_player_id,
            operation: data.transaction.operation,
            amount: data.transaction.amount,
            balance: convertToCents(transactionResult.data.balance) , // Convert to cents
          },
        };
      }

      // If no balance change (pure loss), just commit the status updates
      await session.commitTransaction();
      return {
        success: true,
        message: "Exchange settlement status updated successfully",
        data: {
          id: data.transaction.id,
          ext_transaction_id: data.transaction.id,
          user_id: data.transaction.ext_player_id,
          operation: data.transaction.operation,
          amount: data.transaction.amount,
          balance: convertToCents(user.wallet.balance) , // Convert to cents
        },
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in settleExchangeBet:", error);
      return {
        success: false,
        message: error.message || "Failed to process exchange settlement",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }
  public async rollbackBet(data: IRollbackRequest): Promise<ISettelmentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user by ext_player_id
      const user = await UserModel.findOne({
        luckySportPlayerId: data.transaction.ext_player_id,
      }).populate("wallet");

      if (!user || !user.wallet) {
        throw new Error("User wallet not found");
      }

      // Process each selection in the rollback request
      for (const selection of data.selections) {
        let betOrder;

        // Find and update bet order
        betOrder = await BetOrderModel.findOne({
          betId: selection.bet_id,
          betslipId: selection.betslip_id,
        });

        if (!betOrder) {
          betOrder = await BetOrderModel.findOne({
            betslipId: selection.betslip_id,
            'bets.eventId': selection.bet_id,
            orderType: 'SPORTSBOOK'
          });
        }


        if (!betOrder) {
          throw new Error(
            `Bet order not found for betslip ID: ${selection.betslip_id} and bet ID: ${selection.bet_id}`
          );
        }

        // Update bet order status to OPEN
        await BetOrderModel.findByIdAndUpdate(betOrder._id, {
          status: "OPEN",
          settledAt: null,
          finalizedAt: null,
          rollbackAt: new Date(),
          metadata: {
            ...betOrder.metadata,
            rollbackReason: "Resettlement requested",
            operation: data.transaction.operation,
            previousStatus: betOrder.status,
          },
        });
      }

      // Process balance adjustment if amount is provided
      if (data.transaction.amount !== 0) {
        const amount = Math.abs(data.transaction.amount) / 100; // Convert from cents

        const transactionResult = await this.walletService.processTransaction({
          walletId: user.wallet._id,
          amount,
          type: "DEBIT",
          status: 'COMPLETED',
          category: "ROLLBACK",
          reference: data.transaction.id,
          metadata: {
            betslipId: data.transaction.betslip_id,
            description: "Bet rollback adjustment",
            operation: data.transaction.operation,
            targetType: data.target_type,
            luckySportUserId: data.transaction.player_id,
            selections: data.selections,
          },
        });

        if (!transactionResult.success) {
          throw new Error(transactionResult.message);
        }

        await session.commitTransaction();
        return {
          success: true,
          message: "Rollback processed successfully",
          data: {
            id: data.transaction.id,
            ext_transaction_id: data.transaction.id,
            user_id: data.transaction.ext_player_id,
            operation: data.transaction.operation,
            amount: data.transaction.amount,
            balance: convertToCents(transactionResult.data.balance) , // Convert to cents
          },
        };
      }

      // If no balance adjustment needed
      await session.commitTransaction();
      return {
        success: true,
        message: "Rollback status updated successfully",
        data: {
          id: data.transaction.id,
          ext_transaction_id: data.transaction.id,
          user_id: data.transaction.ext_player_id,
          operation: data.transaction.operation,
          amount: data.transaction.amount,
          balance: convertToCents(user.wallet.balance), // Convert to cents
        },
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in rollbackBet:", error);
      return {
        success: false,
        message: error.message || "Failed to process rollback",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }
  public async processBonusPayout(
    data: IBonusPayoutRequest
  ): Promise<ISettelmentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user by ext_player_id
      const user = await UserModel.findOne({
        luckySportPlayerId: data.transaction.ext_player_id,
      }).populate("wallet");

      if (!user || !user.wallet) {
        throw new Error("User wallet not found");
      }

      // Convert amount from cents to actual value (amount is negative for bonus payouts)
      const amount = Math.abs(data.transaction.amount) / 100;

      // Process bonus credit
      const creditResult = await this.walletService.processTransaction({
        walletId: user.wallet._id,
        amount,
        type: "CREDIT",
        category: "BONUS",
        status: 'COMPLETED',
        reference: data.transaction.id,
        metadata: {
          bonusId: data.bonus_id,
          betslipId: data.transaction.betslip_id,
          description: data.reason || "Bonus payout",
          luckySportUserId: data.transaction.player_id,
          operatorId: data.transaction.operator_id,
          operation: data.transaction.operation,
          operatorBrandId: data.transaction.operator_brand_id,
          selections: data.selections.map((selection) => ({
            betId: selection.bet_id,
            betslipId: selection.betslip_id,
            status: selection.status,
          })),
        },
      });

      if (!creditResult.success) {
        throw new Error(creditResult.message);
      }

      // Create bonus record
      await BetOrderModel.create({
        userId: user._id,
        luckySportUserId: data.transaction.player_id,
        betslipId: data.transaction.betslip_id,
        transactionId: data.transaction.id,
        bonusId: data.bonus_id,
        orderType: "BONUS",
        status: "COMPLETED",
        amount,
        currency: data.transaction.currency,
        operatorId: data.transaction.operator_id,
        operatorBrandId: data.transaction.operator_brand_id,
        metadata: {
          reason: data.reason,
          selections: data.selections,
          operation: data.transaction.operation,
        },
        processedAt: new Date(),
      });

      await session.commitTransaction();
      return {
        success: true,
        message: "Bonus payout processed successfully",
        data: {
          id: data.transaction.id,
          ext_transaction_id: data.transaction.id,
          user_id: data.transaction.ext_player_id,
          operation: data.transaction.operation,
          amount: data.transaction.amount,
          balance: convertToCents(creditResult.data.balance) , // Convert to cents
        },
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in processBonusPayout:", error);
      return {
        success: false,
        message: error.message || "Failed to process bonus payout",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  public async getBalance(userId: string): Promise<ServiceResponse> {
    try {
      const user = await UserModel.findById(userId).populate("wallet");
      if (!user || !user.wallet) {
        return {
          success: false,
          message: "User wallet not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Balance retrieved successfully",
        data: {
          balance: convertToCents(user.wallet.balance) , // Convert to cents
          currency: user.wallet.currency,
          userId: userId,
        },
      };
    } catch (error) {
      this.logger.error("Error in getBalance:", error);
      return {
        success: false,
        message: "Failed to get balance",
        data: null,
      };
    }
  }
}
