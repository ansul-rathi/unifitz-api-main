import { Schema, model, Document, Model } from "mongoose";

export enum BetOrderStatus {
  OPEN = 'OPEN',
  WIN = 'WIN',
  LOST = 'LOST',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

const MODEL_NAME = "BetOrder";
const COLLECTION_NAME = "bet_orders";

const BetOrderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    luckySportUserId: {
      type: String,
      required: true
    },
    betslipId: {
      type: String,
      required: true,
    },
    orderType: {
      type: String,
      enum: ['SPORTSBOOK', 'EXCHANGE', 'BONUS'],
      required: true
    },
    betType: {
      type: String,
      enum: ['BACK', 'LAY'],
      required: function() { return this.orderType === 'EXCHANGE'; }
    },
    bonusId: {
      type: String,
      sparse: true // Optional index
    },
    processedAt: {
      type: Date
    },
    betId: {
      type: String,
      // required: function() { return this.orderType === 'EXCHANGE'; }
    },
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: Object.values(BetOrderStatus),
      default: BetOrderStatus.OPEN
    },
    amount: {
      type: Number,
      required: true
    },
    potentialWin: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    odds: {
      type: String,
      required: true
    },
    bets: [{
      eventId: {
        type: String,
        required: true
      },
      marketId: {
        type: String,
        // required: true
      },
      marketName: {
        type: String,
        // required: true
      },
      outcomeName: {
        type: String,
        // required: true
      },
      odds: {
        type: String,
        required: true
      },
      competitors: [{
        type: String
      }],
      scheduled: {
        type: Date,
        required: true
      },
      sportId: {
        type: String,
        required: true
      },
      tournamentId: {
        type: String,
        // required: true
      },
      live: {
        type: Boolean,
        default: false
      }
    }],
    operatorId: {
      type: String,
      required: true
    },
    operatorBrandId: {
      type: String,
      required: true
    },
    settledAt: {
      type: Date
    },
    settlementAmount: {
      type: Number
    },
    metadata: {
      isCashout: Boolean,
      commission: String,
      tradeProfit: String,
      selections: {
        bet_id: String,
        betslip_id: String,
        profit: String,
        status: String
      },
      finalProfit: String
    }
  },
  { timestamps: true }
);

export interface IBetOrder extends Document {
  userId: string;
  luckySportUserId: string;
  betslipId: string;
  transactionId: string;
  status: BetOrderStatus;
  amount: number;
  potentialWin: number;
  currency: string;
  odds: string;
  bets: Array<{
    eventId: string;
    marketId: string;
    marketName: string;
    outcomeName: string;
    odds: string;
    competitors: string[];
    scheduled: Date;
    sportId: string;
    tournamentId: string;
    live: boolean;
  }>;
  operatorId: string;
  operatorBrandId: string;
  settledAt?: Date;
  settlementAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    isCashout: boolean;
    commission: string;
    tradeProfit: string;
    selections: {
      bet_id: string;
      betslip_id: string;
      profit: string;
      status: string;
    };
    finalProfit: string
  }
}

// BetOrderSchema.index({ bonusId: 1 });

export const BetOrderModel: Model<IBetOrder> = model<IBetOrder>(
  MODEL_NAME,
  BetOrderSchema,
  COLLECTION_NAME
);