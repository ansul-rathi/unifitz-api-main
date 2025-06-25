import { IPreMatchOdds } from "@interfaces/odds.interface";
import { Model, Schema, model } from "mongoose";

const MODEL_NAME = "PreMatchOdds";
const COLLECTION_NAME = "pre_match_odds";

const PreMatchOddsSchema: Schema = new Schema(
  {
    FI: { type: String, required: true, index: true },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true }, // e.g., "1st_over", "prematch", "match"
    updatedAt: { type: Date, required: true },
    eventKey: { type: String, required: true }, // Unique key for this event data
    marketKey: { type: String, required: true }, // e.g., "1st_over_total_runs"
    marketId: { type: String, required: true }, // Market's id (e.g., "300336")
    marketName: { type: String, required: true }, // Market's name (e.g., "1st Over Total Runs")
    oddId: { type: String, required: true }, // Odds entry id (e.g., "216519217")
    oddsValue: { type: Number, required: true }, // Numeric odds value (converted from string)
    header: { type: String, default: null }, // Optional field (e.g., "Over"/"Under")
    oddName: { type: String, required: true }, // The odds label (e.g., "5.5")
    handicap: { type: String, default: null }, // Optional handicap field, if available
    name2: { type: String, default: null },
    name: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

// Create indexes for frequent queries
PreMatchOddsSchema.index({ marketKey: 1 });
PreMatchOddsSchema.index({ eventId: 1, marketKey: 1 });

// Interface for static methods
export interface IPreMatchOddsModel extends Model<IPreMatchOdds> {}

// Create and export the model
export const PreMatchOddsModel = model<IPreMatchOdds, IPreMatchOddsModel>(
  MODEL_NAME,
  PreMatchOddsSchema,
  COLLECTION_NAME
);
