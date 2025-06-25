import { Model, Schema, model } from 'mongoose';
import { ISport } from '@interfaces/sports.interface';

const MODEL_NAME = 'Sport';
const COLLECTION_NAME = 'sports';

const SportSchema: Schema = new Schema({
  sportId: {
    type: String,
    required: [true, 'Sport ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Sport name is required'],
    trim: true
  },
  provider: {
    type: String,
    required: [true, 'Provider name is required'],
    trim: true,
    default: 'bet365'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: COLLECTION_NAME
});

SportSchema.index({ name: 1 });

export interface ISportModel extends Model<ISport> {
  findBySportId(sportId: string): Promise<ISport | null>;
}

// Add static methods
SportSchema.statics.findBySportId = function(sportId: string): Promise<ISport | null> {
  return this.findOne({ sportId });
};

export const SportModel = model<ISport, ISportModel>(MODEL_NAME, SportSchema);