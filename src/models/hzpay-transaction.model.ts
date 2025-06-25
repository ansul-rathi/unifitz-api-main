import mongoose, { Document, Schema } from "mongoose";

export interface IHZPaysTransaction extends Document {
  mainTransactionId: mongoose.Types.ObjectId; // Reference to main transaction
  reference: string;
  transactionId: string; // HZPays-specific transaction ID
  type: string; // "DEPOSIT" or "WITHDRAWAL"
  amount: number;
  realAmount: number; // Actual amount processed by HZPays
  currency: string;
  status: string; // HZPays-specific status
  payMethod: string; // HZPays payment method
  bankCode?: string; // For withdrawals
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  completionTime?: Date;
  failReason?: string;
  proofUrl?: string;
  responseData: Record<string, any>; // Raw response from HZPays
  hzpaysMetadata: Record<string, any>; // Any additional HZPays-specific data
  createdAt: Date;
  updatedAt: Date;
}

const HZPaysTransactionSchema = new Schema(
  {
    mainTransactionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Transaction', 
      required: true,
      index: true
    },
    reference: { type: String, required: true, index: true },
    transactionId: { type: String, sparse: true, index: true },
    type: { type: String, required: true, enum: ["DEPOSIT", "WITHDRAWAL"] },
    amount: { type: Number, required: true },
    realAmount: { type: Number },
    currency: { type: String, default: "INR" },
    status: { type: String, required: true },
    payMethod: { type: String },
    bankCode: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    completionTime: { type: Date },
    failReason: { type: String },
    proofUrl: { type: String },
    responseData: { type: Schema.Types.Mixed, default: {} },
    hzpaysMetadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const HZPaysTransactionModel = mongoose.model<IHZPaysTransaction>(
  "HZPaysTransaction",
  HZPaysTransactionSchema
);