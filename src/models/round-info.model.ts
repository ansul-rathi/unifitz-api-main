import { Schema, model, Document, Model } from "mongoose";

export enum RoundActionType {
  BET = 'bet',
  WIN = 'win'
}

const RoundActionSchema = new Schema({
  actid: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(RoundActionType),
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  }
});

const RoundInfoSchema = new Schema(
  {
    gameid: {
      type: String,
      required: true,
      index: true
    },
    userid: {
      type: String,
      required: true,
      index: true
    },
    i_gamedesc: {
      type: String,
      required: true
    },
    actions: [RoundActionSchema],
    processed: {
      type: Boolean,
      default: false
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export interface IRoundAction extends Document {
  actid: string;
  type: RoundActionType;
  amount: string;
  timestamp: Date;
}

export interface IRoundInfo extends Document {
  gameid: string;
  userid: string;
  i_gamedesc: string;
  actions: IRoundAction[];
  processed: boolean;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create compound index for uniqueness
RoundInfoSchema.index({ gameid: 1, userid: 1 }, { unique: true });

export const RoundInfoModel: Model<IRoundInfo> = model<IRoundInfo>(
  'RoundInfo',
  RoundInfoSchema,
  'round_infos'
);