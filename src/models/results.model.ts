import { Model, Schema, model } from "mongoose";
import { EventTimeStatus } from "@interfaces/bets-api.interface";

const MODEL_NAME = "Result";
const COLLECTION_NAME = "results";

const resultSchema = new Schema({
  eventId: {
    type: String,
    required: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  sportId: {
    type: String,
    required: [true, "Sport ID is required"],
    index: true,
  },
  time: String,
  startTime: Date,
  status: {
    type: String,
    required: [true, "Status is required"],
    enum: Object.values(EventTimeStatus),
    default: EventTimeStatus.ENDED,
  },
  league: {
    type: Schema.Types.Mixed,
    required: true
  },
  home: {
    type: Schema.Types.Mixed,
    required: true
  },
  away: {
    type: Schema.Types.Mixed,
    required: true
  },
  score: String,
  scores: {
    type: Map,
    of: new Schema(
      {
        home: String,
        away: String
      },
      { _id: false }
    ),
    default: {}
  },
  stats: {
    type: Schema.Types.Mixed,
    default: {}
  },
  events: [{
    id: String,
    text: String
  }],
  extra: {
    type: Schema.Types.Mixed,
    default: {}
  },
  provider: String,
  inplay_created_at: String,
  inplay_updated_at: String,
  confirmed_at: String
}, {
  strict: false,
  timestamps: true
});

// Add indexes
resultSchema.index({ eventId: 1 }, { unique: true });
resultSchema.index({ sportId: 1, startTime: -1 });
resultSchema.index({ status: 1 });

interface IResultModel extends Model<any> {
  upsertResult(eventData: any): Promise<any>;
}

// Static method for upserting results
resultSchema.statics.upsertResult = async function(eventData: any) {
  try {
    // Extract the eventId
    const { eventId } = eventData;
    
    if (!eventId) {
      throw new Error('EventId is required for upserting result');
    }

    Object.keys(eventData).forEach(key => 
      eventData[key] === undefined && delete eventData[key]
    );

    const result = await this.findOneAndUpdate(
      { eventId },
      { 
        $set: eventData,
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      {
        new: true,           // Return updated document
        upsert: true,        // Create if doesn't exist
        runValidators: true, // Run schema validations
        lean: true           // Return plain object instead of mongoose document
      }
    );

    return {
      success: true,
      message: 'Result upserted successfully',
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to upsert result',
      data: null
    };
  }
};

export const ResultModel = model<any, IResultModel>(
  MODEL_NAME,
  resultSchema,
  COLLECTION_NAME
);