import { Service, Container } from "typedi";
import { Logger } from "winston";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { UserModel } from "@models/user.model";
import { WalletService } from "./wallet.service";
import { UserRole } from "@enums/user-role.enum";
import mongoose from "mongoose";
import { Parser } from 'json2csv';

@Service()
export class WinPartnerService {
  private logger: Logger = Container.get("logger");
  private walletService: WalletService = Container.get(WalletService);

  public async createPartner(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    reference: string;
    createdBy: string;
  }): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const partner = await UserModel.create(
        [
          {
            name: data.name,
            email: data.email,
            phoneNumber: data.phone,
            password: data.password,
            role: UserRole.WIN_PARTNER,
            reference: data.reference,
            // partnerAccessRoles: data.accessRoles,
            active: true,
            createdBy: data.createdBy,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      const walletResult = await this.walletService.createWallet(
        partner[0]._id
      );

      if (!walletResult.success) {
        throw new Error(walletResult.message);
      }

      return {
        success: true,
        message: "Partner created successfully",
        data: partner[0],
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error creating partner:", error);
      return {
        success: false,
        message: error.message || "Failed to create partner",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  public async updatePartner(
    partnerId: string,
    updateData: {
      name?: string;
      phoneNumber?: string;
      email?: string;
      active?: boolean;
      reference?: string;
    //   partnerAccessRoles?: WinPartnerAccess[];
    }
  ): Promise<ServiceResponse> {
    try {
      // Verify partner exists
      const existingPartner = await UserModel.findOne({
        _id: partnerId,
        role: UserRole.WIN_PARTNER
      });
  
      if (!existingPartner) {
        return {
          success: false,
          message: 'Partner not found',
          data: null
        };
      }
  
      // If email is being updated, check for uniqueness
      if (updateData.email && updateData.email !== existingPartner.email) {
        const emailExists = await UserModel.findOne({
          email: updateData.email,
          _id: { $ne: partnerId }
        });
  
        if (emailExists) {
          return {
            success: false,
            message: 'Email already in use',
            data: null
          };
        }
      }
  
     
  
      // Update partner
      const updatedPartner = await UserModel.findByIdAndUpdate(
        partnerId,
        { $set: updateData },
        { 
          new: true,
          select: '-password -resetPasswordToken -resetPasswordExpire' 
        }
      ).populate('wallet');
  
      if (!updatedPartner) {
        return {
          success: false,
          message: 'Failed to update partner',
          data: null
        };
      }
  
      // If partner is deactivated, log it
      if (updateData.active === false) {
        this.logger.info('Partner deactivated:', {
          partnerId,
          reference: updatedPartner.reference,
          email: updatedPartner.email
        });
      }
  
      return {
        success: true,
        message: 'Partner updated successfully',
        data: updatedPartner
      };
    } catch (error) {
      this.logger.error('Error updating partner:', error);
      return {
        success: false,
        message: error.message || 'Failed to update partner',
        data: null
      };
    }
  }

  public async depositToCustomer(params: {
    partnerId: string;
    customerId: string;
    amount: number;
    description: string;
  }): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get partner and their wallet
      const partner = await UserModel.findById(params.partnerId)
        .populate("wallet")
        .session(session);

      if (!partner || !partner.wallet) {
        throw new Error("Partner or wallet not found");
      }

      // Check if customer belongs to partner
      const customer = await UserModel.findOne({
        _id: params.customerId,
        partnerId: params.partnerId,
      }).session(session);

      if (!customer) {
        throw new Error("Customer not found or does not belong to partner");
      }

      // Check partner wallet balance
      if (partner.wallet.balance < params.amount) {
        throw new Error("Insufficient balance");
      }

      // Deduct from partner wallet
      const debitResult = await this.walletService.processTransaction({
        walletId: partner.wallet._id,
        amount: params.amount,
        type: "DEBIT",
        status: "COMPLETED",
        category: "PARTNER_TRANSFER",
        reference: `PTR-${Date.now()}`,
        metadata: {
          customerId: params.customerId,
          customerName: customer.name,
          description: params.description,
        },
      });

      if (!debitResult.success) {
        throw new Error(debitResult.message);
      }

      // Credit customer wallet
      const creditResult = await this.walletService.processTransaction({
        walletId: customer.wallet,
        amount: params.amount,
        type: "CREDIT",
        status: "COMPLETED",
        category: "PARTNER_DEPOSIT",
        reference: `PDP-${Date.now()}`,
        metadata: {
          partnerId: params.partnerId,
          partnerName: partner.name,
          description: params.description,
        },
      });

      if (!creditResult.success) {
        throw new Error(creditResult.message);
      }

      await session.commitTransaction();

      return {
        success: true,
        message: "Funds transferred successfully",
        data: {
          amount: params.amount,
          customer: customer.name,
          partnerBalance: debitResult.data.balance,
          customerBalance: creditResult.data.balance,
          transactions: {
            debit: debitResult.data._id,
            credit: creditResult.data._id,
          },
        },
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error("Error in partner deposit:", error);
      return {
        success: false,
        message: error.message || "Failed to transfer funds",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  public async getCustomerStats(params: {
    partnerId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ServiceResponse> {
    try {
      const matchQuery: any = { partnerId: params.partnerId };

      if (params.startDate && params.endDate) {
        matchQuery.createdAt = {
          $gte: params.startDate,
          $lte: params.endDate,
        };
      }

      const customers = await UserModel.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: "transactions",
            localField: "wallet",
            foreignField: "walletId",
            as: "transactions",
          },
        },
        {
          $lookup: {
            from: "bet_orders",
            localField: "_id",
            foreignField: "userId",
            as: "bets",
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            createdAt: 1,
            deposits: {
              $sum: {
                $filter: {
                  input: "$transactions",
                  as: "txn",
                  cond: { $eq: ["$$txn.type", "CREDIT"] },
                },
              },
            },
            withdrawals: {
              $sum: {
                $filter: {
                  input: "$transactions",
                  as: "txn",
                  cond: { $eq: ["$$txn.type", "DEBIT"] },
                },
              },
            },
            betsCount: { $size: "$bets" },
            totalWager: { $sum: "$bets.amount" },
            totalPayout: { $sum: "$bets.settlementAmount" },
          },
        },
      ]);

      return {
        success: true,
        message: "Stats retrieved successfully",
        data: customers,
      };
    } catch (error) {
      this.logger.error("Error getting customer stats:", error);
      return {
        success: false,
        message: error.message || "Failed to get customer stats",
        data: null,
      };
    }
  }

  public async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    partnerId: string;
  }): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify partner exists and is active
      const partner = await UserModel.findOne({ 
        _id: data.partnerId,
        role: UserRole.WIN_PARTNER,
        active: true
      });

      if (!partner) {
        throw new Error('Invalid or inactive partner');
      }

      // Create customer
      const customer = await UserModel.create([{
        name: data.name,
        email: data.email,
        phoneNumber: data.phone,
        password: data.password,
        role: UserRole.USER,
        partnerId: data.partnerId,
        active: true
      }], { session });

      // Create wallet for customer
      const walletResult = await this.walletService.createWallet(customer[0]._id);

      if (!walletResult.success) {
        throw new Error(walletResult.message);
      }

      // Update customer with wallet ID
      await UserModel.findByIdAndUpdate(
        customer[0]._id,
        { wallet: walletResult.data._id },
        { session }
      );

      await session.commitTransaction();

      return {
        success: true,
        message: 'Customer created successfully',
        data: {
          ...customer[0].toObject(),
          wallet: walletResult.data
        }
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error creating customer:', error);
      return {
        success: false,
        message: error.message || 'Failed to create customer',
        data: null
      };
    } finally {
      session.endSession();
    }
  }


  public async listCustomers(params: {
    partnerId: string;
    page: number;
    limit: number;
    search?: string;
  }): Promise<ServiceResponse> {
    try {
      const query: any = { 
        partnerId: params.partnerId,
        role: UserRole.USER
      };

      if (params.search) {
        query.$or = [
          { name: new RegExp(params.search, 'i') },
          { email: new RegExp(params.search, 'i') },
          { phoneNumber: new RegExp(params.search, 'i') }
        ];
      }

      const [customers, total] = await Promise.all([
        UserModel.find(query)
          .populate('wallet')
          .skip((params.page - 1) * params.limit)
          .limit(params.limit)
          .sort({ createdAt: -1 }),
        UserModel.countDocuments(query)
      ]);

      return {
        success: true,
        message: 'Customers retrieved successfully',
        data: {
          customers,
          pagination: {
            total,
            page: params.page,
            limit: params.limit,
            pages: Math.ceil(total / params.limit)
          }
        }
      };
    } catch (error) {
      this.logger.error('Error listing customers:', error);
      return {
        success: false,
        message: error.message || 'Failed to list customers',
        data: null
      };
    }
  }

  public async exportCustomerData(params: {
    partnerId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ServiceResponse> {
    try {
      const matchQuery: any = { 
        partnerId: params.partnerId,
        role: UserRole.USER
      };

      if (params.startDate && params.endDate) {
        matchQuery.createdAt = {
          $gte: params.startDate,
          $lte: params.endDate
        };
      }

      const customers = await UserModel.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'transactions',
            localField: 'wallet',
            foreignField: 'walletId',
            as: 'transactions'
          }
        },
        {
          $lookup: {
            from: 'bet_orders',
            localField: '_id',
            foreignField: 'userId',
            as: 'bets'
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            createdAt: 1,
            deposits: {
              $sum: {
                $filter: {
                  input: '$transactions',
                  as: 'txn',
                  cond: { $eq: ['$$txn.type', 'CREDIT'] }
                }
              }
            },
            withdrawals: {
              $sum: {
                $filter: {
                  input: '$transactions',
                  as: 'txn',
                  cond: { $eq: ['$$txn.type', 'DEBIT'] }
                }
              }
            },
            betsCount: { $size: '$bets' },
            totalWager: { $sum: '$bets.amount' },
            totalPayout: { $sum: '$bets.settlementAmount' }
          }
        }
      ]);

      const fields = [
        'name',
        'email',
        'phoneNumber',
        'createdAt',
        'deposits',
        'withdrawals',
        'betsCount',
        'totalWager',
        'totalPayout'
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(customers);

      return {
        success: true,
        message: 'Customer data exported successfully',
        data: csv
      };
    } catch (error) {
      this.logger.error('Error exporting customer data:', error);
      return {
        success: false,
        message: error.message || 'Failed to export customer data',
        data: null
      };
    }
  }
}
