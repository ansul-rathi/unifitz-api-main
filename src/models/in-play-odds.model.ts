import { IInplayOdds } from "@interfaces/odds.interface";
import { Model, Schema, model } from "mongoose";

const MODEL_NAME = "InplayOdds";
const COLLECTION_NAME = "inplay_odds";

const InplayOddsSchema: Schema = new Schema(
  {
    FI: {
      type: String,
      required: true,
      index: true,
    },
    eventId: {
        type: String,
        required: true,
    },
    marketId: {
      type: String,
      required: [true, "Market ID is required"],
    },
    marketName: {
      type: String,
      required: [true, "Market name is required"],
    },
    participants: [
      {
        id: {
          type: String,
          required: [true, "Participant ID is required"],
        },
        name: {
          type: String,
          required: [true, "Participant name is required"],
        },
        odd: {
          type: String,
          required: [true, "Original odd string is required"],
        },
        oddValue: {
          type: Number,
          required: [true, "Calculated odd value is required"],
        },
        suspended: {
          type: Boolean,
          default: false,
        },
      },
    ],

    updatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

// Create indexes for frequent queries
InplayOddsSchema.index({ FI: 1, marketId: 1 });
InplayOddsSchema.index({ marketId: 1, eventId: 1 });
InplayOddsSchema.index({ updatedAt: 1 });

InplayOddsSchema.statics.findByFI = async function (FI: string) {
  return this.find({ FI }).sort({ updatedAt: -1 });
};

InplayOddsSchema.statics.findLatestByMarket = async function (
  FI: string,
  marketId: string
) {
  return this.findOne({
    FI,
    marketId: marketId,
  }).sort({ updatedAt: -1 });
};

// Interface for static methods
export interface IInplayOddsModel extends Model<IInplayOdds> {
  findByFI(FI: string): Promise<IInplayOdds[]>;
  findLatestByMarket(FI: string, marketId: string): Promise<IInplayOdds | null>;
}

// Create and export the model
export const InplayOddsModel = model<IInplayOdds, IInplayOddsModel>(
  MODEL_NAME,
  InplayOddsSchema,
  COLLECTION_NAME
);
