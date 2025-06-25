import { Service, Container } from "typedi";
import { Logger } from "winston";
import { IListUsersParams, IUser } from "@interfaces/user.interface";
import { UserModel } from "@models/user.model";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { hash } from "bcrypt";
import mongoose from "mongoose";
import { WalletModel } from "@models/wallet.model";
import { TransactionModel } from "@models/transactions.model";
import { TicketModel } from "@models/ticket.model";
import { UserRole } from "@enums/user-role.enum";
import { Parser } from "json2csv";

@Service()
export class UserService {
  private logger: Logger = Container.get("logger");

  public async showByPhoneRole(
    phoneNumber: string,
    role: string
  ): Promise<IUser | null> {
    try {
      this.logger.info(
        `UserService - Finding user by phone and role: ${phoneNumber}`
      );

      const user = await UserModel.findOne({
        phoneNumber,
        role,
      });

      return user;
    } catch (error) {
      this.logger.error("Error in showByPhoneRole:", error);
      return null;
    }
  }
  public async show(
    query: Partial<IUser>,
  ): Promise<IUser | null> {
    try {
      this.logger.info(
        `UserService - Finding user `
      );

      const user = await UserModel.findOne(query);

      return user;
    } catch (error) {
      this.logger.error("Error in showByPhoneRole:", error);
      return null;
    }
  }
  


  public async create(userData: Partial<IUser>): Promise<IUser | null> {
    try {
      this.logger.info("UserService - Creating new user");

      const user = await UserModel.create({
        ...userData,
        createdAt: new Date(),
      });

      return user;
    } catch (error) {
      this.logger.error("Error in create:", error);
      return null;
    }
  }

  public async listUsers(params: IListUsersParams): Promise<ServiceResponse> {
    try {
      const query: any = {};

      // Add search filter
      if (params.search) {
        // Default searchable fields if none specified
        const defaultSearchFields = [
          "name",
          "referralCode",
          "email",
          "phoneNumber",
        ];

        // Use provided search fields or fall back to defaults
        const fieldsToSearch =
          params.searchFields && params.searchFields.length > 0
            ? params.searchFields
            : defaultSearchFields;
        // Build the $or query based on specified fields
        query.$or = fieldsToSearch.map((field) => ({
          [field]: { $regex: params.search, $options: "i" },
        }));
      }

      // Add date range filter
      if (params.startDate || params.endDate) {
        query.createdAt = {};
        if (params.startDate) query.createdAt.$gte = params.startDate;
        if (params.endDate) query.createdAt.$lte = params.endDate;
      }

      // Add status filter
      if (params.status) {
        query.status = params.status;
      }

      // Add role filter
      if (params.role) {
        query.role = params.role;
      }

      const total = await UserModel.countDocuments(query);
      const users = await UserModel.find(query)
        .select("-password -refreshToken")
        .populate({
          path: "wallet",
          select: "balance",
        })
        .sort({ [params.sortBy]: params.sortOrder === "desc" ? -1 : 1 })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit);

      return {
        success: true,
        message: "Users retrieved successfully",
        data: {
          users,
          pagination: {
            total,
            page: params.page,
            pages: Math.ceil(total / params.limit),
          },
        },
      };
    } catch (error) {
      this.logger.error("Error in listUsers:", error);
      return {
        success: false,
        message: "Failed to retrieve users",
        data: null,
      };
    }
  }
  public async getUserById(userId: string): Promise<ServiceResponse> {
    try {
      const user = await UserModel.findById(userId)
        .populate({
          path: "wallet",
          select: "balance holdBalance",
        })
        .select("-password -refreshToken");

      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "User retrieved successfully",
        data: user,
      };
    } catch (error) {
      this.logger.error("Error in getUserById:", error);
      return {
        success: false,
        message: "Failed to retrieve user",
        data: null,
      };
    }
  }

  public async updateUser(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<ServiceResponse> {
    try {
      // Remove sensitive fields from update data
      const { email, phoneNumber, name, active, phoneVerified, pendingPhoneNumber } =
        updateData;
        // only add the values to paylaod if they exist

      const payload = {
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
        ...(name && { name }),
        ...(active && { active }),
        ...(phoneVerified && { phoneVerified }),
        ...(pendingPhoneNumber && { pendingPhoneNumber }),
      };

      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: payload,
        },
        { new: true }
      ).select("-password -resetPasswordToken -resetPasswordExpire");

      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "User updated successfully",
        data: user,
      };
    } catch (error) {
      this.logger.error("Error in updateUser:", error);
      return {
        success: false,
        message: "Failed to update user",
        data: null,
      };
    }
  }
  public async updateUserUsingPhone(
    phone: string,
    updateData: Partial<IUser>
  ): Promise<ServiceResponse> {
    try {
      const { email, name, active, phoneVerified, pendingPhoneNumber } =
        updateData;

      const payload: any = {};
      if (phoneVerified) payload.phoneVerified = phoneVerified;
      if (email) payload.email = email;
      if (name) payload.name = name;
      if (active) payload.active = active;
      if (pendingPhoneNumber) payload.pendingPhoneNumber = pendingPhoneNumber;

      const user = await UserModel.findOneAndUpdate(
        {
          phoneNumber: phone,
        },
        {
          $set: payload,
        },
        { new: true }
      ).select("-password -resetPasswordToken -resetPasswordExpire");

      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "User updated successfully",
        data: user,
      };
    } catch (error) {
      this.logger.error("Error in updateUser:", error);
      return {
        success: false,
        message: "Failed to update user",
        data: null,
      };
    }
  }

  public async updatePasswordByAdmin(
    userId: string,
    password: string
  ): Promise<ServiceResponse> {
    try {
      const hashPassword = await hash(password, 10);
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { password: hashPassword } },
        { new: true }
      ).select("-password -resetPasswordToken -resetPasswordExpire");

      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Password updated successfully",
        data: user,
      };
    } catch (error) {
      this.logger.error("Error in updatePasswordByAdmin:", error);
      return {
        success: false,
        message: "Failed to update password",
        data: null,
      };
    }
  }

  public async deleteUser(userId: string): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
        };
      }

      // Delete wallet and related transactions
      const wallet = await WalletModel.findOne({ userId });
      if (wallet) {
        // Delete all transactions for this wallet
        await TransactionModel.deleteMany({
          walletId: wallet._id,
        }).session(session);

        // Delete the wallet
        await WalletModel.findByIdAndDelete(wallet._id).session(session);
      }

      // Delete all tickets created by user
      await TicketModel.deleteMany({
        createdBy: userId,
        createdByModel: "User",
      }).session(session);

      // Finally delete the user
      await UserModel.findByIdAndDelete(userId).session(session);

      // Commit the transaction
      await session.commitTransaction();

      return {
        success: true,
        message: "User and related data deleted successfully",
        data: {
          userId,
          deletedData: {
            wallet: wallet ? true : false,
            transactions: true,
            tickets: true,
            user: true,
          },
        },
      };
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();

      this.logger.error("Error in deleteUser:", {
        error: error.message,
        userId,
        stack: error.stack,
      });

      return {
        success: false,
        message: "Failed to delete user and related data",
        data: null,
      };
    } finally {
      session.endSession();
    }
  }

  public async exportCustomerData(params: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<ServiceResponse> {
    try {
      const matchQuery: any = {
        role: UserRole.USER,
      };

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
        // {
        //   $lookup: {
        //     from: 'bet_orders',
        //     localField: '_id',
        //     foreignField: 'userId',
        //     as: 'bets'
        //   }
        // },
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
            // betsCount: { $size: '$bets' },
            // totalWager: { $sum: '$bets.amount' },
            // totalPayout: { $sum: '$bets.settlementAmount' }
          },
        },
      ]);

      const fields = [
        "name",
        "email",
        "phoneNumber",
        "createdAt",
        "deposits",
        "withdrawals",
        "betsCount",
        "totalWager",
        "totalPayout",
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(customers);

      return {
        success: true,
        message: "Customer data exported successfully",
        data: csv,
      };
    } catch (error) {
      this.logger.error("Error exporting customer data:", error);
      return {
        success: false,
        message: error.message || "Failed to export customer data",
        data: null,
      };
    }
  }
}
