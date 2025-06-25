import { Schema, model, Document, Model } from "mongoose";

const MODEL_NAME = "FundistGame";
const COLLECTION_NAME = "fundist_games";

const FundistGameSchema: Schema = new Schema(
  {
    gameId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: Object,
      required: true
    },
    image: {
      type: String
    },
    imageFullPath: {
      type: String
    },
    url: {
      type: String
    },
    mobileUrl: {
      type: String
    },
    description: {
      type: Object,
      default: {}
    },
    branded: {
      type: Number,
      default: 0
    },
    hasDemo: {
      type: Number,
      default: 0
    },
    categoryIds: [String],
    merchantId: {
      type: String
    },
    subMerchantId: {
      type: String
    },
    aspectRatio: {
      type: String
    },
    pageCode: {
      type: String
    },
    isVirtual: {
      type: String,
      default: "0"
    },
    tableId: {
      type: String
    },
    rtp: {
      type: String
    },
    minBetDefault: {
      type: String
    },
    maxBetDefault: {
      type: String
    },
    maxMultiplier: {
      type: String
    },
    freeround: {
      type: String
    },
    bonusBuy: {
      type: Number,
      default: 0
    },
    megaways: {
      type: Number,
      default: 0
    },
    freespins: {
      type: Number,
      default: 0
    },
    freeBonus: {
      type: Number,
      default: 0
    },
    lastSync: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for better query performance
FundistGameSchema.index({ gameId: 1 }, { unique: true });
FundistGameSchema.index({ merchantId: 1 });
FundistGameSchema.index({ categoryIds: 1 });

export interface IFundistGame extends Document {
  gameId: string;
  name: Record<string, string>;
  image: string;
  imageFullPath: string;
  url: string;
  mobileUrl: string;
  description: Record<string, string>;
  branded: number;
  hasDemo: number;
  categoryIds: string[];
  merchantId: string;
  subMerchantId: string | null;
  aspectRatio: string;
  pageCode: string;
  isVirtual: string;
  tableId: string;
  rtp: string;
  minBetDefault: string;
  maxBetDefault: string;
  maxMultiplier: string;
  freeround: string;
  bonusBuy: number;
  megaways: number;
  freespins: number;
  freeBonus: number;
  lastSync: Date;
}

export const FundistGameModel: Model<IFundistGame> = model<IFundistGame>(
  MODEL_NAME,
  FundistGameSchema,
  COLLECTION_NAME
);