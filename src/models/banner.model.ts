import { Schema, model, Document } from "mongoose";

export enum BannerType {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP'
}

export enum BannerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SCHEDULED = 'SCHEDULED'
}

export interface IBanner extends Document {
  title: string;
  type: BannerType;
  imageUrl: string;
  imageKey: string;
  sequence: number;
  status: BannerStatus;
  linkUrl?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(BannerType),
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageKey: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(BannerStatus),
    default: BannerStatus.ACTIVE
  },
  linkUrl: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create compound index for type and sequence
BannerSchema.index({ type: 1, sequence: 1 });

export const BannerModel = model<IBanner>('Banner', BannerSchema);