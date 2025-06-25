import { Schema, model, Document, Model } from "mongoose";

const MODEL_NAME = "Ticket";
const COLLECTION_NAME = "tickets";

const TicketSchema: Schema = new Schema(
  {
    ticketNo: {
      type: String,
      required: [true, "Please enter a ticket number"],
      length: 6
    },
    title: {
      type: String,
      required: [true, "Please enter a ticket title"],
    },
    description: {
      type: String,
      required: [true, "Please enter a ticket description"],
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'CLOSED', 'REJECTED'],
      default: 'OPEN'
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Staff'
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'createdByModel'
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ['User', 'Staff']
    },
    transactionDetails: {
      
      paymentTxnId: {
        type: String,
      },
      modeOfPayment: {
        type: String,
        enum: ['UPI','BANK_TRANSFER'],
        // enum: ['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'UPI', 'WALLET'],
      },
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        default: "INR",
      },
      remarks: {
        type: String,
      }
    },
  
    type: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAW', 'SUPPORT', 'OTHERS'],
      required: [true, "Please enter a ticket type"]
    },
    recipientDetails: {
      name: {
        type: String,
      },
      accountNumber: {
        type: String,
      },
      bankName: {
        type: String,
      },
      ifscCode: {
        type: String,
      },
      upiId: {
        type: String
      },
      holdLedgerTransactionId: {
        type: String,
      },
      holdReleaseLedgerTransactionId: {
        type: String,
      },

    },
    resolution: {
      comment: {
        type: String,
      },
      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Staff'
      },
      resolvedAt: {
        type: Date
      },
      transactionId: {
        type: String
      }
    },
    paymentReference: {
      type: String,
    },
    conversations: [{
      message: {
        type: String,
        // required: [true, "Please enter a message"]
      },
      sender: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: [true, "Please enter the sender"]
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      attachment: {
        originalName: String,
        mimeType: String,
        size: Number,
        url: String,
        key: String
      }
    }]
  },
  { 
    timestamps: true 
  }
);

TicketSchema.index({ ticketNo: 1 });

// Interface for the document
export interface ITicket extends Document {
  ticketNo: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'REJECTED';
  assignedTo?: string;
  group: string;
  createdBy: string;
  createdByModel: 'User' | 'Staff';
  transactionDetails: {
    paymentTxnId: string;
    modeOfPayment: 'UPI' | 'BANK_TRANSFER';
    // modeOfPayment: 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'UPI' | 'WALLET';
    amount: number;
    remarks: string;
    currency: string;
  };
  type: 'DEPOSIT' | 'WITHDRAW' | 'OTHERS' | 'SUPPORT';
  recipientDetails?: {
    name: string;
    holdLedgerTransactionId: string;
    holdReleaseLedgerTransactionId: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId: string;
  };
  paymentReference?: string;
  resolution?: {
    comment: string;
    resolvedBy: string;
    resolvedAt: Date;
    transactionId: string;
  };
  conversations: {
    message: string;
    sender: string;
    timestamp: Date;
    attachment?: {
      originalName: string,
      mimeType: string,
      size: number,
      url: string,
      key: string
    }
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Create and export the model
export const TicketModel: Model<ITicket> = model<ITicket>(
  MODEL_NAME,
  TicketSchema,
  COLLECTION_NAME
);