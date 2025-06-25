export interface Sport {
    id: number;
    name: string;
    code: string;
    country: string;
    league: string;
    active: boolean;
  }
  
  export interface ISport {
    _id?: string;
    sportId: string;
    name: string;
    provider: string;
    active?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface IUpcomingEventsParams {
    sportId: string;
  }
  
  export interface IMarketOdds {
    id: string;
    name: string;
    selections: {
      id: string;
      name: string;
      odds: number;
      probability?: number;
    }[];
  }
  
  export interface ISportOdds {
    eventId: string;
    markets: IMarketOdds[];
    lastUpdated: Date;
  }