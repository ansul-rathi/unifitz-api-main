import { Service, Container } from "typedi";
import { Logger } from "winston";
import { HZPaysService } from "./hzpays.service";
import { BSDPaymentService } from "./bsdpay.service";
import { ServiceResponse } from "../interfaces/service-response.interface";
import { bsdPayConfig } from "@config/constants";
import {
  CreatePaymentRequest,
  CreateWithdrawalRequest,
  PaymentProvider,
  PaymentMethod,
  TransactionStatus,
} from "../interfaces/payment.interface";
import {
  HZPaysPayMethod,
  HZPaysPayoutNotificationRequest,
} from "../interfaces/hzpays.interface";
// import { BSDPaymentPaymentChannel } from "../interfaces/bsdpayment.interface";
import {
  ITransaction,
  ITransactionType,
  TransactionModel,
} from "@models/transactions.model";
import { WalletModel } from "@models/wallet.model";
import { TicketService } from "./ticket.service";
import { WalletService } from "./wallet.service";
import { BSDPayCurrencyType, BSDPaymentPaymentNotification, BSDPayWithdrawStatus } from "@interfaces/bsdpayment.interface";
import { BSDPayWithdrawalModel } from "@models/bsdpay-withdrawal.model";

@Service()
export class UnifiedPaymentService {
  private logger: Logger = Container.get("logger");
  private hzPaysService: HZPaysService = Container.get(HZPaysService);
  private bsdPaymentService: BSDPaymentService =
    Container.get(BSDPaymentService);
  private ticeketService: TicketService = Container.get(TicketService);
  private walletService: WalletService = Container.get(WalletService);

  /**
   * Create a new deposit payment
   */
  public async createDeposit(
    data: CreatePaymentRequest
  ): Promise<ServiceResponse> {
    try {
      let reference: string;
      let paymentResult: ServiceResponse;

      // Generate reference based on provider
      if (data.paymentProvider === PaymentProvider.HZPAYS) {
        reference = this.hzPaysService.generateReferenceNumber(data.userId);
      } else if (data.paymentProvider === PaymentProvider.BSD_PAYMENT) {
        reference = this.bsdPaymentService.generateReferenceNumber(data.userId);
      } else {
        return {
          success: false,
          message: "Unsupported payment provider",
          data: null,
        };
      }
      // Check if user has a wallet
      const wallet = await WalletModel.findOne({ userId: data.userId });
      if (!wallet) {
        return {
          success: false,
          message: "Wallet not found",
          data: null,
        };
      }

      //   Create transaction record
      const transaction = await TransactionModel.create({
        reference,
        walletId: wallet._id,
        type: ITransactionType.CREDIT,
        amount: data.amount,
        category: "DEPOSIT",
        currency: data.currency || "INR",
        paymentProvider: data.paymentProvider,
        paymentMethod: data.paymentMethod,
        status: TransactionStatus.PENDING,
        metadata: data.metadata || {},
      } as ITransaction);

      // Process with appropriate payment provider
      if (data.paymentProvider === PaymentProvider.HZPAYS) {
        const payMethod = this.mapToHzPaysPayMethod(data.paymentMethod);
        if (!payMethod) {
          await transaction.updateOne({
            status: TransactionStatus.FAILED,
            metadata: { errorMessage: "Unsupported payment method" },
          });
          return {
            success: false,
            message: "Unsupported payment method for HZPays",
            data: null,
          };
        }

        paymentResult = await this.hzPaysService.createPaymentOrder({
          reference,
          amount: data.amount.toString(),
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          payMethod,
          currency: data.currency || "INR",
        });
      } else if (data.paymentProvider === PaymentProvider.BSD_PAYMENT) {
        return {
          success: false,
          message: "UPI payment method is not supported for BSD Payment",
          data: null,
        };
      } else {
        await transaction.updateOne({
          status: TransactionStatus.FAILED,
          metadata: { errorMessage: "Invalid payment provider" },
        });
        return {
          success: false,
          message: "Invalid payment provider",
          data: null,
        };
      }

      // Handle payment creation result
      if (!paymentResult.success) {
        await transaction.updateOne({
          status: TransactionStatus.FAILED,
          metadata: { errorMessage: paymentResult.message },
        });
        return paymentResult;
      }

      // Update transaction with payment URL/transaction ID
      let updateData: any = {
        metadata: {
          ...transaction.metadata,
          providerResponse: paymentResult.data,
        },
      };

      if (
        data.paymentProvider === PaymentProvider.HZPAYS &&
        paymentResult.data.payUrl
      ) {
        updateData.metadata.paymentUrl = paymentResult.data.payUrl;
        updateData.metadata.transactionId = paymentResult.data.transactionId;
      }

      await transaction.updateOne(updateData);

      return {
        success: true,
        message: "Deposit payment created successfully",
        data: {
          reference,
          paymentUrl: paymentResult.data.payUrl,
          paymentData: paymentResult.data,
          provider: data.paymentProvider,
        },
      };
    } catch (error: any) {
      this.logger.error("Error creating deposit:", error);
      return {
        success: false,
        message: error.message || "Failed to create deposit",
        data: null,
      };
    }
  }

  /**
   * Create a withdrawal request
   */
  public async createWithdrawal(
    data: CreateWithdrawalRequest
  ): Promise<ServiceResponse> {
    try {
      let reference: string;
      let transaction: any;
      let withdrawalResult: ServiceResponse;
      const wallet = await WalletModel.findOne({ userId: data.userId });
      if (!wallet) {
        return {
          success: false,
          message: "Wallet not found",
          data: null,
        };
      }

      // Check if the payment provider is supported for withdrawals
      if (![PaymentProvider.HZPAYS, PaymentProvider.BSD_PAYMENT].includes(data.paymentProvider as PaymentProvider)) {
        return {
          success: false,
          message: "Withdrawal is only supported through HZPays or BSD Payment",
          data: null,
        };
      }

      // Generate reference based on payment provider
      reference = data.paymentProvider === PaymentProvider.HZPAYS ? 
        this.hzPaysService.generateReferenceNumber(data.userId) :
        this.bsdPaymentService.generateReferenceNumber(data.userId);

      // Check if there's a ticketId and get holdLedgerTransactionId if present
      if (data.ticketId) {
        // Check if there's a transaction associated with this ticketId
        const ticket = (await this.ticeketService.getTicket(data.ticketId))
          .data;
        if (!ticket) {
          return {
            success: false,
            message: "No ticket found with this ticketId",
            data: null,
          };
        }
        // update ticket with reference
        await this.ticeketService.updateTicket(data.ticketId, {
          paymentReference: reference,
        });


        transaction = await TransactionModel.findOne({
          _id: ticket?.recipientDetails?.holdLedgerTransactionId,
        });

        if (!transaction) {
          return {
            success: false,
            message: "No transaction found with this ticketId",
            data: null,
          };
        }
        // update transaction with reference
        await transaction.updateOne({
          reference,
          paymentProvider: data.paymentProvider,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          metadata: { ...transaction.metadata, ticketId: data.ticketId },
        });
      } else {
        transaction = await this.walletService.processTransaction({
          reference,
          metadata: {
            ...data.metadata,
          },
          type: ITransactionType.DEBIT,
          amount: data.amount,
          currency: data.currency || "INR",
          category: "WITHDRAWAL",
          walletId: wallet._id,
          paymentProvider: data.paymentProvider,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          status: TransactionStatus.PENDING,
        });
      }

      // Create payout order based on the payment provider
      if (data.paymentProvider === PaymentProvider.HZPAYS) {
        // Create payout order at HZPays
        withdrawalResult = await this.hzPaysService.createPayoutOrder({
          eventType: "payout.order.create",
          reference,
          amount: data.amount.toString(),
          currency: data.currency || "INR",
          bankCode: data.bankCode || "",
          province: data.ifscCode || "",
          name: data.accountHolderName,
          accountNumber: data.accountNumber,
          notifyUrl: "",
          email: data.email,
          phone: data.phone,
          merchantId: "", // Will be set in the service
          sign: "", // Will be set in the service
        });
      } else if (data.paymentProvider === PaymentProvider.BSD_PAYMENT) {
        // Create withdrawal using BSD Payment
        withdrawalResult = await this.bsdPaymentService.createWithdraw({
          userId: data.userId,
          mainTransactionId: transaction._id,
          merchantOrderNo: reference,
          amount: data.amount.toString(),
          type: BSDPayCurrencyType.INR, // Default to INR, can be made configurable
          channelCode: "71001", // Default to a channel code that we bind, can be made configurable
          name: data.accountHolderName,
          bankName: data.bankCode || "", // Using bankCode as bankName if provided
          bankAccount: data.accountNumber,
          ifsc: data.ifscCode || "",
          notifyUrl: bsdPayConfig.payoutNotifyUrl,
        });
      }
      console.log({ withdrawalResult });

      // Handle withdrawal creation result
      if (!withdrawalResult.success) {
        await transaction.updateOne({
          status: TransactionStatus.FAILED,
          metadata: { errorMessage: withdrawalResult.message },
        });
        return withdrawalResult;
      }

      // Update transaction with transaction ID
      await transaction.updateOne({
        metadata: {
          ...transaction.metadata,
          transactionId: withdrawalResult.data.transactionId,
          providerResponse: withdrawalResult.data,
        },
      });

      return {
        success: true,
        message: "Withdrawal request created successfully",
        data: {
          reference,
          transactionId: withdrawalResult.data.transactionId,
        },
      };
    } catch (error: any) {
      this.logger.error("Error creating withdrawal:", error);
      return {
        success: false,
        message: error.message || "Failed to create withdrawal",
        data: null,
      };
    }
  }

  /**
   * Process payment notification from HZPays
   */
  public async processHZPaysNotification(
    notificationData: any
  ): Promise<ServiceResponse> {
    try {
      // Validate notification data
      const validationResult =
        this.hzPaysService.validateNotification(notificationData);
      if (!validationResult.success) {
        return validationResult;
      }

      // Extract reference and status from notification
      const { reference, statusCode, amount, transactionId } = notificationData;

      // Find the transaction by reference
      const transaction = await TransactionModel.findOne({ reference });
      if (!transaction) {
        return {
          success: false,
          message: "No transaction found with this reference",
          data: null,
        };
      }

      // Update transaction based on payment status
      if (statusCode === "success") {
        // Update transaction with success info
        await transaction.updateOne({
          status: TransactionStatus.COMPLETED,
          transactionId,
          metadata: {
            ...transaction.metadata,
            completionTime: notificationData.completionTime,
            payMethod: notificationData.payMethod,
          },
        });

        // Notify main application about the successful payment
        await this.notifyMainApplication(transaction);

        return {
          success: true,
          message: "Payment completed successfully",
          data: {
            transactionId,
            reference,
            amount,
          },
        };
      } else {
        // Payment failed
        await transaction.updateOne({
          status: TransactionStatus.FAILED,
          metadata: {
            ...transaction.metadata,
            failReason: notificationData.failReason || "Unknown error",
          },
        });

        // Notify main application about the failed payment
        await this.notifyMainApplication(transaction);

        return {
          success: false,
          message: "Payment failed",
          data: {
            reference,
            failReason: notificationData.failReason || "Unknown error",
          },
        };
      }
    } catch (error: any) {
      this.logger.error("Error processing HZPays notification:", error);
      return {
        success: false,
        message: error.message || "Failed to process payment notification",
        data: null,
      };
    }
  }

  /**
   * Process payment notification from BSD Payment
   */
  public async processBSDPaymentNotification(
    headers: any,
    notificationData: any
  ): Promise<ServiceResponse> {
    try {
      // Validate notification header
      const validationResult =
        this.bsdPaymentService.validateNotification(headers);
      if (!validationResult.success) {
        return validationResult;
      }

      // Extract order reference and status from notification
      const {
        merchantorder: reference,
        status,
        amount,
        orderno: orderId,
        proof,
      } = notificationData;

      // Find the transaction by reference
      const transaction = await TransactionModel.findOne({ reference });
      if (!transaction) {
        return {
          success: false,
          message: "No transaction found with this reference",
          data: null,
        };
      }

      // Update transaction based on payment status
      if (status === BSDPayWithdrawStatus.SUCCESS) {
        // Update transaction with success info
        await transaction.updateOne({
          status: TransactionStatus.COMPLETED,
          metadata: {
            ...transaction.metadata,
            orderId,
            proof,
            completionTime: notificationData.updatetime,
          },
        });

        // Notify main application about the successful payment
        await this.notifyMainApplication(transaction);

        return {
          success: true,
          message: "Payment completed successfully",
          data: {
            orderId,
            reference,
            amount,
          },
        };
      } else {
        // Payment failed
        await transaction.updateOne({
          status: TransactionStatus.FAILED,
          metadata: {
            ...transaction.metadata,
            failReason: "Payment failed",
          },
        });

        // Notify main application about the failed payment
        await this.notifyMainApplication(transaction);

        return {
          success: false,
          message: "Payment failed",
          data: {
            reference,
          },
        };
      }
    } catch (error: any) {
      this.logger.error("Error processing BSD Payment notification:", error);
      return {
        success: false,
        message: error.message || "Failed to process payment notification",
        data: null,
      };
    }
  }

  /**
   * Process payout (withdrawal) notification from HZPays
   */
  public async processHZPaysPayoutNotification(
    notificationData: HZPaysPayoutNotificationRequest
  ): Promise<ServiceResponse> {
    try {
      // Validate notification data
      const validationResult =
        this.hzPaysService.validatePayoutNotification(notificationData);
      if (!validationResult.success) {
        return validationResult;
      }

      // Extract reference and status from notification
      const { reference, state, amount, realAmount, transactionId } =
        notificationData;

      // todo: use amount
      console.log({ amount });

      // Find the transaction by reference
      const transaction = await TransactionModel.findOne({ reference });
      if (!transaction) {
        return {
          success: false,
          message: "No transaction found with this reference",
          data: null,
        };
      }

      // Update transaction based on withdrawal status
      if (state === "success") {
        // Update transaction with success info
        await transaction.updateOne({
          status: TransactionStatus.COMPLETED,
          category: "WITHDRAWAL",
          metadata: {
            ...transaction.metadata,
            amount: notificationData.amount,
            hzpaysRealAmount: realAmount,
            hzpaysTransactionId: transactionId,
            proofUrl: notificationData.proofUrl || "",
          },
        });

        // Notify main application about successful withdrawal
        await this.notifyMainApplication(transaction);

        return {
          success: true,
          message: "Withdrawal processed successfully",
          data: {
            transactionId,
            reference,
            transaction,
            amount: realAmount,
          },
        };
      } else {
        // Withdrawal failed
        await transaction.updateOne({
          status: TransactionStatus.FAILED,
          metadata: {
            ...transaction.metadata,
            failReason: notificationData.failReason || "Unknown error",
          },
        });

        // Notify main application about failed withdrawal
        await this.notifyMainApplication(transaction);

        return {
          success: false,
          message: "Withdrawal failed",
          data: {
            reference,
            failReason: notificationData.failReason || "Unknown error",
          },
        };
      }
    } catch (error: any) {
      this.logger.error("Error processing withdrawal notification:", error);
      return {
        success: false,
        message: error.message || "Failed to process withdrawal notification",
        data: null,
      };
    }
  }

  /**
   * Process payout (withdrawal) notification from BSD Payment
   */
  public async processBSDPaymentPayoutNotification(
    notificationData: BSDPaymentPaymentNotification
  ): Promise<ServiceResponse> {
    try {
      // Validate notification data - optional, as it might come directly from the webhook
      const validationResult = this.bsdPaymentService.validateNotification(notificationData);
      if (!validationResult.success) {
        this.logger.error(`Invalid notification data: ${JSON.stringify(notificationData)}`);
        return validationResult;
      }

      // Extract data from notification
      const {
        merchantorder: merchantOrderNo, // Merchant's reference number
        status, // Current status
        amount, // Transaction amount 
        fee, // Fee charged
        proof, // UTR for INR, hash for TRX/USDT
        updatetime // Last update time
      } = notificationData;
      
      // Get the order number if it exists
      const orderNo = notificationData.orderno;

      // Find the BSDPay withdrawal record by merchant order number
      const withdrawalRecord = await BSDPayWithdrawalModel.findOne({ merchantOrderNo });
      
      if (!withdrawalRecord) {
        this.logger.error(`No BSD Pay withdrawal record found with merchant order: ${merchantOrderNo}`);
        return {
          success: false,
          message: "No withdrawal record found with this reference",
          data: null
        };
      }

      // Find the transaction by reference
      const transaction = await TransactionModel.findOne({ reference: merchantOrderNo });
      
      // Map the BSD Pay status to the appropriate system status
      let systemStatus = TransactionStatus.PENDING;
      let withdrawalStatus = BSDPayWithdrawStatus.WAITING; // Default to waiting instead of processing
      
      if (status === 'success') {
        systemStatus = TransactionStatus.COMPLETED;
        withdrawalStatus = BSDPayWithdrawStatus.SUCCESS;
      } else if (status === 'fail') {
        systemStatus = TransactionStatus.FAILED;
        withdrawalStatus = BSDPayWithdrawStatus.FAIL;
      } else if (status === 'overrule') {
        systemStatus = TransactionStatus.FAILED;
        withdrawalStatus = BSDPayWithdrawStatus.OVERRULE;
      }
      
      // Create status change log entry
      const statusChangeLog = {
        previousStatus: withdrawalRecord.status,
        newStatus: withdrawalStatus,
        changeDate: new Date(),
        metadata: {
          event: 'notification',
          notificationTime: updatetime,
          proof
        }
      };
      
      // Update the BSDPay withdrawal record
      await withdrawalRecord.updateOne({
        $set: {
          status: withdrawalStatus,
          notificationData: notificationData,
          completionTime: status === 'success' ? new Date(updatetime) : undefined,
          failReason: status === 'fail' ? 'Payment provider declined' : undefined
        },
        $push: {
          statusChangeLogs: statusChangeLog
        }
      });
      
      this.logger.info(`BSD Pay withdrawal record updated: ${withdrawalRecord._id}, status: ${withdrawalStatus}`);
      
      // Update the main transaction if it exists
      if (transaction) {
        await transaction.updateOne({
          status: systemStatus,
          metadata: {
            ...transaction.metadata,
            completionTime: updatetime,
            orderNo, // Use the orderNo
            proof,
            fee,
            bsdPayStatus: status
          }
        });
        
        this.logger.info(`Main transaction updated: ${transaction._id}, status: ${systemStatus}`);
        
        // Notify main application about the status change
        // await this.notifyMainApplication(transaction);
      }
      
      return {
        success: true,
        message: `Withdrawal ${status === 'success' ? 'completed' : status === 'fail' ? 'failed' : 'updated'} successfully`,
        data: {
          withdrawalId: withdrawalRecord._id,
          status: withdrawalStatus,
          merchantOrderNo,
          amount,
          fee,
          proof
        }
      };
    } catch (error: any) {
      this.logger.error("Error processing BSD Payment payout notification:", error);
      return {
        success: false,
        message: error.message || "Failed to process payout notification",
        data: null
      };
    }
  }

  /**
   * Check payment status
   */
  public async checkPaymentStatus(
    reference: string,
    payerId?: string
  ): Promise<ServiceResponse> {
    try {
      // Check local database first
      const transaction = await TransactionModel.findOne({ reference });

      if (!transaction) {
        return {
          success: false,
          message: "Transaction not found",
          data: null,
        };
      }

      // If transaction is already marked as completed or failed, return that status
      if (transaction.status !== TransactionStatus.PENDING) {
        return {
          success: true,
          message: `Transaction is ${transaction.status.toLowerCase()}`,
          data: {
            status: transaction.status,
            reference,
            transactionId: transaction._id,
            amount: transaction.amount,
            currency: transaction.currency,
          },
        };
      }

      // For pending transactions, check with the appropriate payment provider
      if (transaction.type === ITransactionType.CREDIT) {
        if (transaction.paymentProvider === PaymentProvider.HZPAYS) {
          const paymentStatus =
            await this.hzPaysService.queryPaymentOrder(reference);

          if (
            paymentStatus.success &&
            paymentStatus.data.statusCode === "success"
          ) {
            // Update transaction if needed
            await transaction.updateOne({
              status: TransactionStatus.COMPLETED,
              metadata: {
                ...transaction.metadata,
                transactionId: paymentStatus.data.transactionId,
              },
            });

            // Notify main application
            await this.notifyMainApplication(transaction);
          }

          return {
            success: true,
            message: "Payment status retrieved",
            data: {
              ...paymentStatus.data,
              localStatus: transaction.status,
            },
          };
        } else if (
          transaction.paymentProvider === PaymentProvider.BSD_PAYMENT &&
          payerId
        ) {
          const paymentStatus = await this.bsdPaymentService.queryOrderStatus(
            reference,
            payerId
          );

          if (paymentStatus.success) {
            const statusData = paymentStatus.data;

            // Update transaction if needed
            if (statusData.status === "success") {
              await transaction.updateOne({
                status: TransactionStatus.COMPLETED,
                metadata: {
                  ...transaction.metadata,
                  orderId: statusData.orderno,
                  proof: statusData.proof,
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            } else if (statusData.status === "fail") {
              await transaction.updateOne({
                status: TransactionStatus.FAILED,
                metadata: {
                  ...transaction.metadata,
                  failReason: "Payment failed",
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            }
          }

          return {
            success: true,
            message: "Payment status retrieved",
            data: {
              ...paymentStatus.data,
              localStatus: transaction.status,
            },
          };
        } else {
          return {
            success: true,
            message: "Payment status pending",
            data: {
              status: transaction.status,
              reference,
            },
          };
        }
      } else if (transaction.type === ITransactionType.DEBIT) {
        if (transaction.paymentProvider === PaymentProvider.HZPAYS) {
          // Handle withdrawal status check for HZPays
          const payoutStatus =
            await this.hzPaysService.queryPayoutOrder(reference);

          if (payoutStatus.success) {
            // Update transaction if HZPays has a definitive status
            if (payoutStatus.data.state === "success") {
              await transaction.updateOne({
                status: TransactionStatus.COMPLETED,
                metadata: {
                  ...transaction.metadata,
                  transactionId: payoutStatus.data.transactionId,
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            } else if (payoutStatus.data.state === "fail") {
              await transaction.updateOne({
                status: TransactionStatus.FAILED,
                metadata: {
                  ...transaction.metadata,
                  failReason: "Payment gateway reports failure",
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            }
          }

          return {
            success: true,
            message: "Withdrawal status retrieved",
            data: {
              ...payoutStatus.data,
              localStatus: transaction.status,
            },
          };
        } else if (transaction.paymentProvider === PaymentProvider.BSD_PAYMENT) {
          // Handle withdrawal status check for BSD Payment
          const payoutStatus = 
            await this.bsdPaymentService.queryWithdrawOrder(reference);
            
          if (payoutStatus.success) {
            // Update transaction based on BSD Payment status
            if (payoutStatus.data.status === "success") {
              await transaction.updateOne({
                status: TransactionStatus.COMPLETED,
                metadata: {
                  ...transaction.metadata,
                  orderNo: payoutStatus.data.orderNo,
                  merchantOrderNo: payoutStatus.data.merchantOrderNo,
                  fee: payoutStatus.data.fee,
                  completionTime: payoutStatus.data.timestamp
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            } else if (payoutStatus.data.status === "fail" || payoutStatus.data.status === "overrule") {
              await transaction.updateOne({
                status: TransactionStatus.FAILED,
                metadata: {
                  ...transaction.metadata,
                  failReason: `Payout ${payoutStatus.data.status}`,
                  orderNo: payoutStatus.data.orderNo,
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            }
          }

          return {
            success: true,
            message: "Withdrawal status retrieved",
            data: {
              ...payoutStatus.data,
              localStatus: transaction.status,
            },
          };
        }
      }

      // Default response for other cases
      return {
        success: true,
        message: "Transaction status retrieved",
        data: {
          status: transaction.status,
          reference,
          amount: transaction.amount,
          currency: transaction.currency,
        },
      };
    } catch (error: any) {
      this.logger.error("Error checking payment status:", error);
      return {
        success: false,
        message: error.message || "Failed to check payment status",
        data: null,
      };
    }
  }
  /**
   * Check payment status
   */
  public async checkBSDPaymentStatus(
    reference: string,
    payerId?: string
  ): Promise<ServiceResponse> {
    try {
      // Check local database first
      const transaction = await TransactionModel.findOne({ reference });

      if (!transaction) {
        return {
          success: false,
          message: "Transaction not found",
          data: null,
        };
      }
      console.log("reached here: ", transaction)


      if (transaction.type === ITransactionType.CREDIT) {
        if (
          transaction.paymentProvider === PaymentProvider.BSD_PAYMENT &&
          payerId
        ) {
          const paymentStatus = await this.bsdPaymentService.queryOrderStatus(
            reference,
            payerId
          );

          if (paymentStatus.success) {
            const statusData = paymentStatus.data;

            // Update transaction if needed
            if (statusData.status === "success") {
              await transaction.updateOne({
                status: TransactionStatus.COMPLETED,
                metadata: {
                  ...transaction.metadata,
                  orderId: statusData.orderno,
                  proof: statusData.proof,
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            } else if (statusData.status === "fail") {
              await transaction.updateOne({
                status: TransactionStatus.FAILED,
                metadata: {
                  ...transaction.metadata,
                  failReason: "Payment failed",
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            }
          }

          return {
            success: true,
            message: "Payment status retrieved",
            data: {
              ...paymentStatus.data,
              localStatus: transaction.status,
            },
          };
        } else {
          return {
            success: true,
            message: "Payment status pending",
            data: {
              status: transaction.status,
              reference,
            },
          };
        }
      } else if (transaction.type === ITransactionType.DEBIT) {
       if (true || transaction.paymentProvider === PaymentProvider.BSD_PAYMENT) {
          const payoutStatus = 
            await this.bsdPaymentService.queryWithdrawOrder(reference);
            console.log({payoutStatus})
          if (payoutStatus.success) {
            // Update transaction based on BSD Payment status
            if (payoutStatus.data.status === "success") {
              await transaction.updateOne({
                status: TransactionStatus.COMPLETED,
                metadata: {
                  ...transaction.metadata,
                  orderNo: payoutStatus.data.orderNo,
                  merchantOrderNo: payoutStatus.data.merchantOrderNo,
                  fee: payoutStatus.data.fee,
                  completionTime: payoutStatus.data.timestamp
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            } else if (payoutStatus.data.status === "fail" || payoutStatus.data.status === "overrule") {
              await transaction.updateOne({
                status: TransactionStatus.FAILED,
                metadata: {
                  ...transaction.metadata,
                  failReason: `Payout ${payoutStatus.data.status}`,
                  orderNo: payoutStatus.data.orderNo,
                },
              });

              // Notify main application
              await this.notifyMainApplication(transaction);
            }
          }

          return {
            success: true,
            message: "Withdrawal status retrieved",
            data: {
              ...payoutStatus.data,
              localStatus: transaction.status,
            },
          };
        }
      }

      // Default response for other cases
      return {
        success: true,
        message: "Transaction status retrieved",
        data: {
          status: transaction.status,
          reference,
          amount: transaction.amount,
          currency: transaction.currency,
        },
      };
    } catch (error: any) {
      this.logger.error("Error checking payment status:", error);
      return {
        success: false,
        message: error.message || "Failed to check payment status",
        data: null,
      };
    }
  }

  /**
   * Submit payment proof (UTR) for BSD Payment
   */
  public async submitPaymentProof(
    reference: string,
    proof: string,
    payerId: string
  ): Promise<ServiceResponse> {
    try {
      // Find the transaction
      const transaction = await TransactionModel.findOne({ reference });

      if (!transaction) {
        return {
          success: false,
          message: "Transaction not found",
          data: null,
        };
      }

      if (transaction.paymentProvider !== PaymentProvider.BSD_PAYMENT) {
        return {
          success: false,
          message: "Payment proof submission is only supported for BSD Payment",
          data: null,
        };
      }

      // Submit proof
      const result = await this.bsdPaymentService.submitPaymentProof(
        reference,
        proof,
        payerId
      );

      if (result.success) {
        // Update transaction metadata
        await transaction.updateOne({
          metadata: {
            ...transaction.metadata,
            submittedProof: proof,
            proofSubmissionTime: new Date(),
          },
        });
      }

      return result;
    } catch (error: any) {
      this.logger.error("Error submitting payment proof:", error);
      return {
        success: false,
        message: error.message || "Failed to submit payment proof",
        data: null,
      };
    }
  }

  /**
   * Query UPI status (BSD Payment)
   */
  public async queryUpi(upi: string): Promise<ServiceResponse> {
    try {
      return await this.bsdPaymentService.queryUpi(upi);
    } catch (error: any) {
      this.logger.error("Error querying UPI status:", error);
      return {
        success: false,
        message: error.message || "Failed to query UPI status",
        data: null,
      };
    }
  }

  /**
   * Query account balance from payment provider
   */
  public async queryAccountBalance(
    provider: PaymentProvider
  ): Promise<ServiceResponse> {
    try {
      if (provider === PaymentProvider.HZPAYS) {
        return await this.hzPaysService.queryAccountBalance();
      } else if (provider === PaymentProvider.BSD_PAYMENT){
        return await this.bsdPaymentService.queryBalance();
      } else {
        return {
          success: false,
          message: "Balance query not supported for this provider",
          data: null,
        };
      }
    } catch (error: any) {
      this.logger.error(
        `Error querying account balance for ${provider}:`,
        error
      );
      return {
        success: false,
        message: error.message || "Failed to query account balance",
        data: null,
      };
    }
  }

  /**
   * Notify the main application about transaction status changes - currently just logs the transaction
   * In the future, this could be used to call an API endpoint with notification data
   */
  private async notifyMainApplication(transaction: any): Promise<void> {
    try {
      this.logger.info(`Transaction status changed: ${transaction._id}, status: ${transaction.status}`);
      console.log(`Transaction details:`, {
        reference: transaction.reference,
        status: transaction.status,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        metadata: transaction.metadata
      });
      
      // Implementation for actual notification to other services can be added here
      // Example:
      // await axios.post(`${this.mainAppBaseUrl}/api/payments/callback`, {
      //   reference: transaction.reference,
      //   status: transaction.status,
      //   type: transaction.type,
      //   amount: transaction.amount,
      //   currency: transaction.currency,
      //   metadata: transaction.metadata,
      // });
    } catch (error: any) {
      this.logger.error("Failed to notify main application:", error);
      // We don't want to fail the whole process if notification fails
    }
  }

  /**
   * Maps internal payment methods to HZPays payment methods
   * @param internalMethod The internal payment method to map
   * @returns The corresponding HZPays payment method or null if not supported
   */
  private mapToHzPaysPayMethod(internalMethod: string): string | null {
    switch (internalMethod) {
      case PaymentMethod.UPI:
        return HZPaysPayMethod.UPI_INDIA;
      case PaymentMethod.BANK_TRANSFER:
        return HZPaysPayMethod.NATIVE_INDIA;
      default:
        return null;
    }
  }

  // /**
  //  * Maps internal payment methods to BSD Payment channels
  //  */
  // private mapToBSDPaymentChannel(internalMethod: string): string | null {
  //   switch (internalMethod) {
  //     case PaymentMethod.UPI:
  //       return BSDPaymentPaymentChannel.UPI_PAYMENT;
  //     case PaymentMethod.BANK_TRANSFER:
  //       return BSDPaymentPaymentChannel.BANK_TRANSFER;
  //     default:
  //       return null;
  //   }
  // }
}
