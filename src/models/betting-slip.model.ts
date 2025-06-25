// import { Model, Schema, model } from "mongoose";
// import { IBettingSlip, SelectionStatus } from "@interfaces/betting-slip.interface";

// const MODEL_NAME = "BettingSlip";
// const COLLECTION_NAME = "betting_slips";

// const BettingSlipSchema: Schema = new Schema(
//   {
//     userId: { 
//       type: String, 
//       required: [true, "User ID is required"],
//       index: true
//     },
//     currency: { 
//       type: String, 
//       required: [true, "Currency is required"],
//       default: "USD"
//     },
//     status: {
//       type: String,
//       enum: Object.values(SelectionStatus),
//       default: SelectionStatus.PENDING
//     },
//     selections: [{
//       eventId: {
//         type: String,
//         required: [true, "Event ID is required"]
//       },
//       marketId: {
//         type: String,
//         required: [true, "Market ID is required"]
//       },
//       outcomeId: {
//         type: String,
//         required: [true, "Outcome ID is required"]
//       },
//       odds: {
//         type: Number,
//         required: [true, "Odds are required"],
//         min: [1.01, "Odds must be at least 1.01"]
//       },
//       stake: {
//         type: Number,
//         required: [true, "Stake is required"],
//         min: [0.1, "Minimum stake is 0.1"]
//       },
//       status: {
//         type: String,
//         enum: Object.values(SelectionStatus),
//         default: SelectionStatus.PENDING
//       },
//       meta: {
//         eventName: String,
//         marketName: String,
//         outcomeName: String
//       },
//       addedAt: {
//         type: Date,
//         default: Date.now
//       }
//     }],
//     totalStake: {
//       type: Number,
//       default: 0,
//       min: [0, "Total stake cannot be negative"]
//     },
//     potentialPayout: {
//       type: Number,
//       default: 0,
//       min: [0, "Potential payout cannot be negative"]
//     },
//     placedAt: {
//         type: Date,
//         default: null,
//     },
//     active: {
//       type: Boolean,
//       default: true
//     }
//   },
//   { 
//     timestamps: true,
//     collection: COLLECTION_NAME
//   }
// );

// // Indexes
// BettingSlipSchema.index({ userId: 1, createdAt: -1 });
// BettingSlipSchema.index({ status: 1 });

// // Methods
// BettingSlipSchema.methods.calculatePotentialPayout = function() {
//   if (!this.selections.length) {
//     this.potentialPayout = 0;
//     return;
//   }

//   // For single bets
//   if (this.selections.length === 1) {
//     this.potentialPayout = this.selections[0].stake * this.selections[0].odds;
//     return;
//   }

//   // For multiple bets (accumulator)
//   let totalOdds = this.selections.reduce((acc, selection) => acc * selection.odds, 1);
//   this.potentialPayout = this.totalStake * totalOdds;
// };

// BettingSlipSchema.methods.updateTotalStake = function() {
//   this.totalStake = this.selections.reduce((sum, selection) => sum + selection.stake, 0);
// };

// // Pre-save middleware
// BettingSlipSchema.pre('save', function(next) {
//   (this as any).updateTotalStake();
//   (this as any).calculatePotentialPayout();
//   next();
// });

// // Static methods
// BettingSlipSchema.statics.findByUserId = async function(userId: string) {
//   return this.find({ userId, active: true })
//     .sort({ createdAt: -1 });
// };

// BettingSlipSchema.statics.findActiveByStatus = async function(status: SelectionStatus) {
//   return this.find({ 
//     status,
//     active: true
//   }).sort({ createdAt: -1 });
// };

// // Export interfaces
// export interface IBettingSlipModel extends Model<IBettingSlip> {
//   findByUserId(userId: string): Promise<IBettingSlip[]>;
//   findActiveByStatus(status: SelectionStatus): Promise<IBettingSlip[]>;
// }

// // Create and export model
// export const BettingSlipModel = model<IBettingSlip, IBettingSlipModel>(
//   MODEL_NAME,
//   BettingSlipSchema,
//   COLLECTION_NAME
// );