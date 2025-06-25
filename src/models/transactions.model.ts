import { Schema, model, Document, Model } from "mongoose";

const MODEL_NAME = "Transaction";
const COLLECTION_NAME = "transactions";

const TransactionSchema: Schema = new Schema(
  {
    timestamp: {
      type: Date,
      required: true
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    balance: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
      default: 'PENDING'
    },
    reference: {
      type: String,
      required: true,
    },
    paymentProvider: { type: String, required: false },
    paymentMethod: { type: String, required: false },
    metadata: {
      betId: String,
      ticketId: String,
      description: String,
      operatorId: String,
      operatorBrandId: String,
      luckySportUserId: String,

      // casino metadata
      fundistId:String,
      gameId: String,
      gameDesc: String,
      actionId: String,
      jackpotWin: Number,
      subtype: String,
      gameExtra: String,
      rollback: String,
      extParams: String,
      bonusId: String,
      bonusDesc: String,

      hzpaysTransactionId: String,
      hzpaysRealAmount: String,
      // payment metadata
    }
  },
  {
    timestamps: true
  }
  // { 
  //   timeseries: {
  //     timeField: 'timestamp',
  //     metaField: 'walletId',
  //     granularity: 'seconds'
  //   },
  //   expireAfterSeconds: 31536000 // Keep data for 1 year
  // }
);

// Create indexes for better query performance
TransactionSchema.index({ timestamp: 1, walletId: 1 });
TransactionSchema.index({ reference: 1 }, { unique: true });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ category: 1 });

export enum ITransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}


export interface ITransaction extends Document {
  timestamp: Date;
  walletId: string;
  type: ITransactionType;
  amount: number;
  currency: string;
  balance: number;
  category: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  reference: string;
  paymentProvider: string;
  paymentMethod: string;
  metadata?: {
    betId?: string;
    ticketId?: string;
    description?: string;
    operatorId?: string;
    fundistId?: string;
    operatorBrandId?: string;
    luckySportUserId?: string;
    jackpotWin?: Number,
    subtype?: string,
    gameExtra?: string,
    rollback?: string,
    extParams?: string,
    [key: string]: any;
  };
}

export const TransactionModel: Model<ITransaction> = model<ITransaction>(
  MODEL_NAME,
  TransactionSchema,
  COLLECTION_NAME
);



