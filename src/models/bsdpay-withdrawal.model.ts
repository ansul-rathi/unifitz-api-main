import { BSDPayCurrencyType, BSDPayWithdrawStatus } from "@interfaces/bsdpayment.interface";
import mongoose, { Document, Schema } from "mongoose";

// Status change log interface
export interface IStatusChangeLog {
  previousStatus: string;
  newStatus: string;
  changeDate: Date;
  metadata?: Record<string, any>;
}

// Main BSDPay Withdrawal interface
export interface IBSDPayWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;           // Reference to user
  mainTransactionId?: mongoose.Types.ObjectId; // Reference to main transaction if applicable
  merchantOrderNo: string;                   // Merchant's reference number
  orderNo: string;                           // BSD Pay's order number
  amount: number;                            // Amount to withdraw
  fee: number;                               // Fee charged by BSD Pay
  type: BSDPayCurrencyType;                  // Currency type (INR, TRX, USDT)
  channelCode: string;                       // Channel code used
  status: BSDPayWithdrawStatus;              // Current status of the withdrawal
  
  // INR-specific fields
  name?: string;                             // Beneficiary name
  bankName?: string;                         // Bank name
  bankAccount?: string;                      // Bank account number
  ifsc?: string;                             // IFSC code
  
  // Crypto-specific fields
  address?: string;                          // Crypto wallet address for TRX or USDT
  
  // Response and notification data
  responseData: Record<string, any>;         // Raw response from BSD Pay
  notificationData?: Record<string, any>;    // Notification data from callback
  
  // Status change history
  statusChangeLogs: IStatusChangeLog[];      // History of status changes
  
  // Timestamps
  completionTime?: Date;                     // When the withdrawal was completed
  failReason?: string;                       // Reason for failure if applicable
  createdAt: Date;
  updatedAt: Date;
}

// Schema for status change logs
const StatusChangeLogSchema = new Schema<IStatusChangeLog>({
  previousStatus: { type: String },
  newStatus: { type: String },
  changeDate: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed }
}, { _id: false });

// Main schema for BSD Pay withdrawals
const BSDPayWithdrawalSchema = new Schema<IBSDPayWithdrawal>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    mainTransactionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Transaction',
      sparse: true,
      index: true 
    },
    merchantOrderNo: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    orderNo: { 
      type: String,
      sparse: true,
      index: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    fee: { 
      type: Number,
      default: 0
    },
    type: { 
      type: String, 
      required: true,
      enum: [BSDPayCurrencyType.INR, BSDPayCurrencyType.TRX, BSDPayCurrencyType.USDT]
    },
    channelCode: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      required: true,
      enum: Object.values(BSDPayWithdrawStatus),
      default: BSDPayWithdrawStatus.CREATED
    },
    
    // INR-specific fields
    name: { type: String },
    bankName: { type: String },
    bankAccount: { type: String },
    ifsc: { type: String },
    
    // Crypto-specific fields
    address: { type: String },
    
    // Response and notification data
    responseData: { 
      type: Schema.Types.Mixed, 
      default: {} 
    },
    notificationData: { 
      type: Schema.Types.Mixed 
    },
    
    // Status change history
    statusChangeLogs: [StatusChangeLogSchema],
    
    // Additional fields
    completionTime: { type: Date },
    failReason: { type: String }
  },
  { timestamps: true }
);

// Pre-save hook to add status change log when status changes
BSDPayWithdrawalSchema.pre('save', function(next) {
//   const withdrawal = this as IBSDPayWithdrawal;
  
  // If this is a new document, no need to log status change
  if (this.isNew) {
    return next();
  }
  
  // Check if status has been modified
  if (this.isModified('status')) {
    const previousStatus = this.get('status', null, { getters: false, virtuals: false });
    
    // Add to status change log
    this.statusChangeLogs.push({
      previousStatus: previousStatus,
      newStatus: this.status,
      changeDate: new Date(),
      metadata: {} // Can be populated with additional info if needed
    });
  }
  
  next();
});

// Exports
export const BSDPayWithdrawalModel = mongoose.model<IBSDPayWithdrawal>(
  "BSDPayWithdrawal", 
  BSDPayWithdrawalSchema
);