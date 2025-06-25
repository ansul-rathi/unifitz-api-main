import { IWallet } from "@interfaces/wallet.interface";
import { Schema, model, Model } from "mongoose";

const MODEL_NAME = "Wallet";
const COLLECTION_NAME = "wallets";

const WalletSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    holdBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED'],
      default: 'ACTIVE'
    },
    lastTransactionAt: {
      type: Date
    }
  },
  { timestamps: true }
);



export const WalletModel: Model<IWallet> = model<IWallet>(
  MODEL_NAME,
  WalletSchema,
  COLLECTION_NAME
);