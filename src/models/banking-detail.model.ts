import { Schema, model, Document } from "mongoose";

export interface IBankingDetails extends Document {
  qrCodeUrl?: string; // URL of the QR code image
  qrCodeKey?: string; // S3 key for the QR code image
  upiId?: string; // UPI ID for deposits
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    beneficaryName: string;
  };
  createdBy: string; // Admin who created/updated the details
  updatedAt: Date; // Last updated timestamp
}

const BankingDetailsSchema = new Schema(
  {
    qrCodeUrl: {
      type: String,
      trim: true,
    },
    qrCodeKey: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
    },
    bankDetails: {
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
      beneficiaryName: { type: String, trim: true },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

export const BankingDetailsModel = model<IBankingDetails>(
  "BankingDetails",
  BankingDetailsSchema
);