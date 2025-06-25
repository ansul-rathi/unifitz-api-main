// import { Document } from "mongoose";

// export enum SelectionStatus {
//   PENDING = "PENDING",
//   PLACED = "PLACED",
//   WON = "WON",
//   LOST = "LOST",
//   VOID = "VOID",
//   CANCELLED = "CANCELLED"
// }

// export interface ISelection {
//   _id?: string;
//   eventId: string;
//   marketId: string;
//   outcomeId: string;
//   odds: number;
//   stake: number;
//   status: SelectionStatus;
//   addedAt: Date;
// }

// export interface IBettingSlip extends Document {
//   userId: string;
//   currency: string;
//   selections: ISelection[];
//   totalStake: number;
//   potentialPayout: number;
//   status: SelectionStatus;
//   createdAt: Date;
//   updatedAt: Date;
//   placedAt: Date;
// }

// export interface ListSlipsOptions {
//   status?: string;
//   page: number;
//   limit: number;
//   fromDate?: Date;
//   toDate?: Date;
// }