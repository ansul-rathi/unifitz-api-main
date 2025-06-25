import Container, { Service } from 'typedi';
import { Logger } from 'winston';
import { WalletService } from './wallet.service';
import { TicketService } from './ticket.service';
import { ServiceResponse } from '@interfaces/service-response.interface';
import {  IStaffWalletOperation } from '@interfaces/wallet.interface';
import { UserModel } from '@models/user.model';
import { UserRole } from '@enums/user-role.enum';

@Service()
export class TransactionCoordinatorService {
    private logger: Logger = Container.get("logger")
    private walletService: WalletService = Container.get(WalletService);
    private ticketService: TicketService = Container.get(TicketService)

  public async processStaffDeposit(data: IStaffWalletOperation): Promise<ServiceResponse> {
    try {

      const user = await UserModel.findOne({ _id: data.userId });
      if (user.role === UserRole.WIN_PARTNER ) {
        return {
          success: false,
          message: "Deposit not allowed for win partners. If admin use wallet/admin/deposit",
          data: null
        };
      }

      // Process wallet deposit
      const depositResult = await this.walletService.deposit(data);
      if (!depositResult.success) {
        throw new Error(depositResult.message);
      }

      // If ticket resolution is requested
      if (data.ticketId && data.ticketResolution) {
        const ticketResult = await this.ticketService.updateTicket(data.ticketId, {
          status: data.ticketResolution.status,
          'transactionDetails.paymentTxnId': data.paymentTxnId,
          resolution: {
            comment: data.ticketResolution.comment,
            resolvedBy: data.staffId,
            resolvedAt: new Date(),
            transactionId: depositResult.data.transactionId
          }
        });

        if (!ticketResult.success) {
          this.logger.warn(`Deposit successful but ticket update failed: ${ticketResult.message}`);
        }

        // Add resolution conversation
        await this.ticketService.addConversation(data.ticketId, {
          message: `Deposit of ${data.amount} processed. ${data.ticketResolution.comment}`,
          sender: data.staffId
        });
      }

      return depositResult;
    } catch (error) {
      this.logger.error('Error in processStaffDeposit:', error);
      return {
        success: false,
        message: error.message || 'Failed to process deposit',
        data: null
      };
    }
  }
  public async processAdminDeposit(data: IStaffWalletOperation): Promise<ServiceResponse> {
    try {

      // Process wallet deposit
      const depositResult = await this.walletService.deposit(data);
      if (!depositResult.success) {
        throw new Error(depositResult.message);
      }
       // If ticket resolution is requested
       if (data.ticketId && data.ticketResolution) {
        const ticketResult = await this.ticketService.updateTicket(data.ticketId, {
          status: data.ticketResolution.status,
          'transactionDetails.paymentTxnId': data.paymentTxnId,
          resolution: {
            comment: data.ticketResolution.comment,
            resolvedBy: data.staffId,
            resolvedAt: new Date(),
            transactionId: depositResult.data.transactionId
          }
        });

        if (!ticketResult.success) {
          this.logger.warn(`Deposit successful but ticket update failed: ${ticketResult.message}`);
        }

        // Add resolution conversation
        await this.ticketService.addConversation(data.ticketId, {
          message: `Deposit of ${data.amount} processed. ${data.ticketResolution.comment}`,
          sender: data.staffId
        });
      }

      return depositResult;
    } catch (error) {
      this.logger.error('Error in processStaffDeposit:', error);
      return {
        success: false,
        message: error.message || 'Failed to process deposit',
        data: null
      };
    }
  }

  public async processStaffWithdrawal(data: IStaffWalletOperation): Promise<ServiceResponse> {
    try {
      // Process wallet withdrawal
      const user = await UserModel.findOne({ _id: data.userId });
      if (user.role === UserRole.WIN_PARTNER ) {
        return {
          success: false,
          message: "Withdrawal not allowed for win partners. If admin use wallet/admin/withdraw",
          data: null
        };
      }
      const withdrawalResult = await this.walletService.staffWithdraw(data);
      if (!withdrawalResult.success) {
        throw new Error(withdrawalResult.message);
      }

      // If ticket resolution is requested
      if (data.ticketId && data.ticketResolution) {
        const ticketResult = await this.ticketService.updateTicket(data.ticketId, {
          status: data.ticketResolution.status,
          'transactionDetails.paymentTxnId': data.paymentTxnId,
          resolution: {
            comment: data.ticketResolution.comment,
            resolvedBy: data.staffId,
            resolvedAt: new Date(),
            transactionId: withdrawalResult.data.transactionId
          }
        });

        if (!ticketResult.success) {
          this.logger.warn(`Withdrawal successful but ticket update failed: ${ticketResult.message}`);
        }

        // Add resolution conversation
        await this.ticketService.addConversation(data.ticketId, {
          message: `Withdrawal of ${data.amount} processed. ${data.ticketResolution.comment}`,
          sender: data.staffId
        });
      }

      return withdrawalResult;
    } catch (error) {
      this.logger.error('Error in processStaffWithdrawal:', error);
      return {
        success: false,
        message: error.message || 'Failed to process withdrawal',
        data: null
      };
    }
  }
  public async processAdminWithdrawal(data: IStaffWalletOperation): Promise<ServiceResponse> {
    try {

      // Process wallet withdrawal
      const withdrawalResult = await this.walletService.staffWithdraw(data);
      if (!withdrawalResult.success) {
        throw new Error(withdrawalResult.message);
      }

      // If ticket resolution is requested
      if (data.ticketId && data.ticketResolution) {
        const ticketResult = await this.ticketService.updateTicket(data.ticketId, {
          status: data.ticketResolution.status,
          'transactionDetails.paymentTxnId': data.paymentTxnId,
          resolution: {
            comment: data.ticketResolution.comment,
            resolvedBy: data.staffId,
            resolvedAt: new Date(),
            transactionId: withdrawalResult.data.transactionId
          }
        });

        if (!ticketResult.success) {
          this.logger.warn(`Withdrawal successful but ticket update failed: ${ticketResult.message}`);
        }

        // Add resolution conversation
        await this.ticketService.addConversation(data.ticketId, {
          message: `Withdrawal of ${data.amount} processed. ${data.ticketResolution.comment}`,
          sender: data.staffId
        });
      }

      return withdrawalResult;
    } catch (error) {
      this.logger.error('Error in processStaffWithdrawal:', error);
      return {
        success: false,
        message: error.message || 'Failed to process withdrawal',
        data: null
      };
    }
  }

  public async processStaffRejectWithdrawal(data: IStaffWalletOperation): Promise<ServiceResponse> {
    try {
      if (!data.holdLedgerTransactionId) {
        return {
          success: false,
          message: 'Hold transaction ID is required for rejection',
          data: null
        };
      }
  
      // Release the held amount
      const releaseResult = await this.walletService.releaseHold({
        holdId: data.holdLedgerTransactionId,
        reason: `Withdrawal rejected by staff: ${data.ticketResolution?.comment || 'No reason provided'}`,
      });
  
      if (!releaseResult.success) {
        throw new Error(`Failed to release hold: ${releaseResult.message}`);
      }
  
      // If ticket resolution is requested
      if (data.ticketId && data.ticketResolution) {
        const ticketResult = await this.ticketService.updateTicket(data.ticketId, {
          status: 'REJECTED',
          'recipientDetails.holdReleaseLedgerTransactionId': releaseResult.data.releaseTransaction._id,
          resolution: {
            comment: data.ticketResolution.comment,
            resolvedBy: data.staffId,
            resolvedAt: new Date(),
            transactionId: releaseResult.data.releaseTransaction._id
          }
        });
  
        if (!ticketResult.success) {
          this.logger.warn(`Hold release successful but ticket update failed: ${ticketResult.message}`);
        }
  
        // Add rejection conversation
        await this.ticketService.addConversation(data.ticketId, {
          message: `Withdrawal rejected. Amount ${data.amount} returned to wallet. Reason: ${data.ticketResolution.comment}`,
          sender: data.staffId
        });
      }
  
      return {
        success: true,
        message: 'Withdrawal rejected and funds returned successfully',
        data: {
          releaseTransaction: releaseResult.data.releaseTransaction,
          updatedBalance: releaseResult.data.updatedBalance
        }
      };
  
    } catch (error) {
      this.logger.error('Error in processStaffRejectWithdrawal:', {
        error: error.message,
        userId: data.userId,
        ticketId: data.ticketId,
        holdId: data.holdLedgerTransactionId
      });
  
      return {
        success: false,
        message: error.message || 'Failed to process withdrawal rejection',
        data: null
      };
    }
  }
  public async processStaffRejectDeposit(data: IStaffWalletOperation): Promise<ServiceResponse> {
    try {
      // If ticket resolution is requested
      if (data.ticketId && data.ticketResolution) {
        const ticketResult = await this.ticketService.updateTicket(data.ticketId, {
          status: 'REJECTED',
          resolution: {
            comment: data.ticketResolution.comment,
            resolvedBy: data.staffId,
            resolvedAt: new Date(),
          }
        });
  
        if (!ticketResult.success) {
          this.logger.warn(`ticket update failed: ${ticketResult.message}`);
        }
  
        // Add rejection conversation
        await this.ticketService.addConversation(data.ticketId, {
          message: `Deposit rejected. Reason: ${data.ticketResolution.comment}`,
          sender: data.staffId
        });
      }
  
      return {
        success: true,
        message: 'Deposit rejected',
        data: {
        }
      };
  
    } catch (error) {
      this.logger.error('Error in processStaffRejectDeposit:', {
        error: error.message,
        userId: data.userId,
        ticketId: data.ticketId,
      });
  
      return {
        success: false,
        message: error.message || 'Failed to process withdrawal rejection',
        data: null
      };
    }
  }

}