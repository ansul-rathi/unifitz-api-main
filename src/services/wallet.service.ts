import { Service } from "typedi";
import { Logger } from "winston";
import { Container } from "typedi";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { WalletModel } from "@models/wallet.model";
import { UserModel } from "@models/user.model";
import mongoose from "mongoose";
import { ITransaction, TransactionModel } from "@models/transactions.model";
import { IStaffWalletOperation } from "@interfaces/wallet.interface";

@Service()
export class WalletService {
  private logger: Logger = Container.get("logger");

  /**
   * Creates a new wallet for a user.
   * @param userId - The id of the user to create a wallet for
   * @returns A ServiceResponse with the newly created wallet or an error message if the wallet creation fails
   */
  public async createWallet(userId: string): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await WalletModel.create(
        [
          {
            userId,
            balance: 0,
          },
        ],
        { session }
      );

      await UserModel.findByIdAndUpdate(
        userId,
        { wallet: wallet[0]._id },
        { session }
      );

      await session.commitTransaction();
      return {
        success: true,
        message: "Wallet created successfully",
        data: wallet[0],
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error creating wallet:", error);
      return {
        success: false,
        message: "Failed to create wallet",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Process a transaction on the given wallet.
   *
   * @param data - The transaction data.
   * @param data.walletId - The identifier of the wallet.
   * @param data.amount - The amount of the transaction.
   * @param data.type - The type of the transaction, either 'CREDIT' or 'DEBIT'.
   * @param data.category - The category of the transaction.
   * @param data.reference - The reference identifier for the transaction.
   * @param data.metadata - Optional metadata for the transaction.
   * @returns A ServiceResponse indicating the success or failure of the operation.
   */
  public async processTransaction(data: {
    walletId: string;
    amount: number;
    status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
    type: "CREDIT" | "DEBIT";
    category: string;
    paymentMethod?: string;
    paymentProvider?: string;
    currency?: string;
    reference: string;
    metadata?: any;
  }): Promise<ServiceResponse> {
    try {
      const wallet = await WalletModel.findOneAndUpdate(
        { _id: data.walletId },
        {
          $inc: {
            balance: data.type === "CREDIT" ? data.amount : -data.amount,
          },
          $set: { lastTransactionAt: new Date() },
        },
        { new: true, runValidators: true }
      );

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // time series transaction record
      const transaction = await TransactionModel.create({
        ...data,
        timestamp: new Date(),
        balance: wallet.balance,
      });

      return {
        success: true,
        message: "Transaction processed successfully",
        data: transaction,
      };
    } catch (error) {
      this.logger.error("Error processing transaction:", error);

      // If it's an insufficient balance error from the wallet update
      if (error.message.includes("min")) {
        return {
          success: false,
          message: "Insufficient balance",
          data: null,
        };
      }

      return {
        success: false,
        message: error.message || "Failed to process transaction",
        data: null,
      };
    }
  }

  /**
   * Retrieves the balance of the wallet with the given id
   * @param walletId The id of the wallet to retrieve the balance for
   * @returns A ServiceResponse with the balance and currency of the wallet
   *          or an error message if the wallet is not found
   */
  public async getBalance(walletId: string): Promise<ServiceResponse> {
    try {
      const wallet = await WalletModel.findById(walletId);
      if (!wallet) {
        return {
          success: false,
          message: "Wallet not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Balance retrieved successfully",
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
        },
      };
    } catch (error) {
      this.logger.error("Error getting balance:", error);
      return {
        success: false,
        message: "Failed to get balance",
        data: null,
      };
    }
  }
  /**
   * Retrieves the balance of the wallet with the given id
   * @param userId The id of the user to retrieve the balance for
   * @returns A ServiceResponse with the balance and currency of the wallet
   *          or an error message if the wallet is not found
   */
  public async getBalanceByUserId(userId: string): Promise<ServiceResponse> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
        };
      }
      const walletId = user.wallet;
      const wallet = await WalletModel.findById(walletId);
      if (!wallet) {
        return {
          success: false,
          message: "Wallet not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Balance retrieved successfully",
        data: {
          balance: wallet.balance,
          holdBalance: wallet.holdBalance,
          currency: wallet.currency,
          userId: wallet.userId,
        },
      };
    } catch (error) {
      this.logger.error("Error getting balance:", error);
      return {
        success: false,
        message: "Failed to get balance",
        data: null,
      };
    }
  }
  /**
   * Retrieves the transaction history for a given wallet
   * @param walletId The id of the wallet to retrieve the transaction history for
   * @param query An object with the following properties:
   *              page: The page number to retrieve (starts at 1)
   *              limit: The number of transactions to retrieve per page
   *              category: An optional category to filter by (one of 'DEPOSIT', 'WITHDRAWAL', 'BET', 'WINNINGS', 'REFUND', 'BONUS')
   *              startDate: An optional start date to filter by (inclusive)
   *              endDate: An optional end date to filter by (inclusive)
   * @returns A ServiceResponse with the transaction history and pagination info
   *          or an error message if the wallet is not found
   */
  // public async getTransactionHistory(
  //   walletId: string,
  //   query: {
  //     page?: number;
  //     limit?: number;
  //     category?: string;
  //     startDate?: Date;
  //     endDate?: Date;
  //   }
  // ): Promise<ServiceResponse> {
  //   try {
  //     const { page = 1, limit = 10, category, startDate, endDate } = query;
  //     const filter: any = { walletId };

  //     if (category) {
  //       filter.category = category;
  //     }

  //     if (startDate || endDate) {
  //       filter.createdAt = {};
  //       if (startDate) filter.createdAt.$gte = startDate;
  //       if (endDate) filter.createdAt.$lte = endDate;
  //     }

  //     const transactions = await TransactionModel.find(filter)
  //       .sort({ createdAt: -1 })
  //       .skip((page - 1) * limit)
  //       .limit(limit);

  //     const total = await TransactionModel.countDocuments(filter);

  //     return {
  //       success: true,
  //       message: "Transaction history retrieved successfully",
  //       data: {
  //         transactions,
  //         pagination: {
  //           total,
  //           page,
  //           limit,
  //           pages: Math.ceil(total / limit),
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error("Error getting transaction history:", error);
  //     return {
  //       success: false,
  //       message: "Failed to get transaction history",
  //       data: null,
  //     };
  //   }
  // }
  public async getTransactionsByUserId(params: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ServiceResponse> {
    try {
      const wallet = await WalletModel.findOne({ userId: params.userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const query: any = { walletId: wallet._id };
      if (params.startDate) query.timestamp = { $gte: params.startDate };
      if (params.endDate)
        query.timestamp = { ...query.timestamp, $lte: params.endDate };
      if (params.category) query.category = params.category;
      if (params.status) {
        query.status = params.status;
      }
      // Build sort object
      const sort: any = {};
      if (params.sortBy) {
        sort[params.sortBy] = params.sortOrder === "asc" ? 1 : -1;
      }
      if (params.type) query.type = params.type;

      const total = await TransactionModel.countDocuments(query);
      const transactions = await TransactionModel.find(query)
        .sort({ timestamp: -1 })
        .skip(((params.page || 1) - 1) * (params.limit || 10))
        .limit(params.limit || 10);

      return {
        success: true,
        message: "Successfully retrieved transactions",
        data: {
          transactions,
          pagination: {
            total,
            page: params.page || 1,
            pages: Math.ceil(total / (params.limit || 10)),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  public async holdBalance(data: {
    userId: string;
    amount: number;
    reference: string;
    metadata?: any;
  }): Promise<ServiceResponse> {
    try {
      // Check if wallet has sufficient balance minus existing holds
      const wallet = await WalletModel.findOne({ userId: data.userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.balance < data.amount) {
        throw new Error("Insufficient available balance");
      }

      // Update hold balance
      const updatedWallet = await WalletModel.findOneAndUpdate(
        { userId: data.userId },
        {
          $inc: { holdBalance: data.amount, balance: -data.amount },
          $set: { lastTransactionAt: new Date() },
        },
        { new: true, runValidators: true }
      );

      // Create hold transaction record separately (not in transaction)
      const transaction = await TransactionModel.create({
        walletId: updatedWallet._id,
        amount: data.amount,
        type: "DEBIT",
        status: "PENDING",
        category: "WITHDRAWAL_HOLD",
        reference: data.reference,
        metadata: data.metadata,
        timestamp: new Date(),
        balance: updatedWallet.balance,
      });

      return {
        success: true,
        message: "Balance hold created successfully",
        data: {
          holdId: transaction._id,
          balance: updatedWallet.balance,
          holdBalance: updatedWallet.holdBalance,
        },
      };
    } catch (error) {
      this.logger.error("Error creating balance hold:", error);

      // If wallet was updated but transaction failed, rollback the wallet update
      if (error.message.includes("time-series")) {
        await WalletModel.findOneAndUpdate(
          { userId: data.userId },
          {
            $inc: { holdBalance: -data.amount, balance: data.amount },
            $set: { lastTransactionAt: new Date() },
          }
        );
      }

      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Releases a balance hold.
   *
   * @param {Object} params Parameters for releasing the hold.
   * @param {string} params.holdId The ID of the hold transaction to release.
   * @param {string} params.reason The reason for releasing the hold.
   * @returns {Promise<ServiceResponse>} A service response object.
   * The response object will contain the newly created HOLD_RELEASE transaction
   * and the updated wallet balance.
   */
  public async releaseHold(params: {
    holdId: string;
    // amount: number
    reason: string;
  }): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the hold transaction
      const holdTransaction = await TransactionModel.findOne({
        _id: params.holdId,
      }).session(session);

      if (!holdTransaction) {
        throw new Error("Hold transaction not found");
      }

      // Find the wallet
      const wallet = await WalletModel.findById(
        holdTransaction.walletId
      ).session(session);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.holdBalance < holdTransaction.amount) {
        throw new Error("Insufficient hold balance to release");
      }

      const updatedWallet = await WalletModel.findOneAndUpdate(
        { _id: holdTransaction.walletId },
        {
          $inc: {
            holdBalance: -holdTransaction.amount,
            balance: holdTransaction.amount,
          },
          $set: { lastTransactionAt: new Date() },
        },
        { new: true, runValidators: true }
      );

      // Release the hold by creating a HOLD_RELEASE transaction
      const releaseTransaction = await TransactionModel.create(
        [
          {
            walletId: updatedWallet._id,
            amount: holdTransaction.amount,
            type: "CREDIT",
            status: "COMPLETED",
            category: "WITHDRAWAL_RELEASE",
            reference: `RELEASE-${holdTransaction.reference}`,
            metadata: {
              originalHoldId: holdTransaction._id,
              reason: params.reason,
            },
            timestamp: new Date(),
            balance: updatedWallet.balance,
          },
        ],
        { session }
      );

      // holdTransaction.category = 'RELEASED';
      // await holdTransaction.save({ session });

      // Update wallet balance

      await session.commitTransaction();

      return {
        success: true,
        message: "Hold released successfully",
        data: {
          releaseTransaction: releaseTransaction[0],
          updatedBalance: wallet.balance,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process a staff-initiated deposit into a user's wallet.
   * @param data - The deposit data.
   * @param data.userId - The ID of the user whose wallet to deposit into.
   * @param data.amount - The amount of the deposit.
   * @param data.description - A description of the deposit.
   * @param data.staffId - The ID of the staff member performing the deposit.
   * @returns A ServiceResponse indicating the success or failure of the operation.
   */
  public async deposit(data: IStaffWalletOperation): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let wallet = await WalletModel.findOne({ userId: data.userId });

      // check if user exists:
     if(!wallet){
      const user = await UserModel.findById(data.userId);
      if (!user) {
        throw new Error("Wallet not found");
      } else {
        const walletResult = await this.createWallet(data.userId);
        if (!walletResult.success) {
          throw new Error(walletResult.message);
        }
        wallet = walletResult.data;
      }
    }

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const transactionResult = await this.processTransaction({
        walletId: wallet._id,
        amount: data.amount,
        type: "CREDIT",
        status: "COMPLETED",
        category: "DEPOSIT",
        reference: `STAFF-DEP-${Date.now()}`,
        metadata: {
          ticketId: data?.ticketId,
          description: data?.description,
          staffId: data?.staffId,
        },
      });

      if (!transactionResult.success) {
        throw new Error(transactionResult.message);
      }

      await session.commitTransaction();
      return {
        success: true,
        message: "Deposit processed successfully",
        data: {
          balance: transactionResult.data.balance,
          transactionId: transactionResult.data.transactionId,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        success: false,
        message: error.message,
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Process a staff-initiated withdrawal from a user's wallet.
   * @param data - The withdrawal data.
   * @param data.userId - The ID of the user whose wallet to withdraw from.
   * @param data.amount - The amount of the withdrawal.
   * @param data.description - A description of the withdrawal.
   * @param data.staffId - The ID of the staff member performing the withdrawal.
   * @returns A ServiceResponse indicating the success or failure of the operation.
   */
  public async staffWithdraw(
    data: IStaffWalletOperation
  ): Promise<ServiceResponse> {
    try {
      const wallet = await WalletModel.findOne({ userId: data.userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Get the original hold transaction
      const holdTransaction = await TransactionModel.findById(
        data.holdLedgerTransactionId
      );

      // An Staff can withdraw anytime
      // if (!holdTransaction || holdTransaction.status !== 'PENDING') {
      //   throw new Error('Invalid hold transaction');
      // }

      let updatedTransaction: ITransaction | null = null;

      if (!holdTransaction) {
        const transactionResult = await this.processTransaction({
          walletId: wallet._id,
          amount: data.amount,
          type: "DEBIT",
          category: "WITHDRAWAL",
          status: "COMPLETED",
          reference: `STAFF-WD-${Date.now()}`,
          metadata: {
            description: data.description,
            ticketId: data.ticketId,
            staffId: data.staffId,
            completedAt: new Date(),
          },
        });

        if (!transactionResult.success) {
          throw new Error(transactionResult.message);
        }
        return {
          success: true,
          message: "Staff withdrawal processed successfully",
          data: {
            balance: transactionResult.data.balance,
            transactionId: transactionResult.data.transactionId,
          },
        };
      }

      // Update the transaction first before updating the wallet
      updatedTransaction = await TransactionModel.findByIdAndUpdate(
        data.holdLedgerTransactionId,
        {
          $set: {
            status: "COMPLETED",
            type: "DEBIT",
            category: "WITHDRAWAL",
            reference: `STAFF-WD-${Date.now()}`,
            processedAt: new Date(),
            processedBy: data.staffId,
            metadata: {
              ...holdTransaction.metadata,
              description: data.description,
              ticketId: data.ticketId,
              staffId: data.staffId,
              completedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!updatedTransaction) {
        throw new Error("Failed to update transaction");
      }

      // Update wallet balance
      const updatedWallet = await WalletModel.findOneAndUpdate(
        { _id: wallet._id },
        {
          $inc: { holdBalance: -data.amount },
          $set: { lastTransactionAt: new Date() },
        },
        { new: true }
      );

      if (!updatedWallet) {
        // Rollback transaction update if wallet update fails
        await TransactionModel.findByIdAndUpdate(data.holdLedgerTransactionId, {
          $set: {
            status: "PENDING",
            type: "DEBIT",
            category: "WITHDRAWAL_HOLD",
            ...holdTransaction,
          },
        });
        throw new Error("Failed to update wallet");
      }

      return {
        success: true,
        message: "Staff withdrawal processed successfully",
        data: {
          balance: updatedWallet.balance,
          transactionId: updatedTransaction?._id,
          holdBalance: updatedWallet.holdBalance,
        },
      };
    } catch (error) {
      this.logger.error("Error processing withdrawal:", error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}
