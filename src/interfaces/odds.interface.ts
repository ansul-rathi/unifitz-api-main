import { Document } from "mongoose";

export interface IPreMatchOdds extends Document {
  FI: string;
  eventId: string;
  eventType: string;
  eventKey: string;
  marketKey: string;
  marketId: string;
  marketName: string;
  oddId: string;
  oddsValue: number;
  header: string | null;
  oddName: string;
  handicap: string | null;
  name2: string | null;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface IInplayOdds extends Document {
  FI: string;
  eventId: string;
  marketId: string;
  marketName: string;
  participants: Array<{
    id: string;
    name: string;
    odd: string;
    oddValue: number;
    suspended: boolean;
  }>;
  updatedAt: Date;
  createdAt: Date;
}
