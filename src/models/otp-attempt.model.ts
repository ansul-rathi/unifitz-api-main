import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpAttempt extends Document {
  phoneNumber: string;
  attempts: number;
  lastAttempt: Date;
  resetAt: Date;
}

const OtpAttemptSchema: Schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  resetAt: {
    type: Date,
    default: function() {
      // Set reset time to midnight of the next day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    },
  },
});

// Create a TTL index that automatically removes documents after the resetAt date
OtpAttemptSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const OtpAttemptModel = mongoose.model<IOtpAttempt>('OtpAttempt', OtpAttemptSchema);