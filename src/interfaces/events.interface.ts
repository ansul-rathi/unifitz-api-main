import { EventTimeStatus } from "./bets-api.interface";

export interface ITeam {
  id: string;
  name: string;
  image_id?: string;
  cc?: string; // country code
}

export interface ILeague {
  id: string;
  name: string;
  cc?: string; // country code
}

export interface ISportEvent {
  id: string;
  sport_id: string;
  time: string;
  time_status: string;
  league: ILeague;
  home: ITeam;
  away: ITeam;
  ss: string | null; // score
  // Additional fields after transformation
  startTime?: Date;
}
export interface IEventMetadata {
  ourEventId?: string;
  externalId?: string;
}

export interface IEvent {
  eventId: string;       // Unique event ID (mapped from "eventId" in schema)
  sportId: string;       // Sport identifier
  startTime: Date;       // Start time as a Date (converted from epoch)
  status: EventTimeStatus | string; // Event status (enum)
  league: {
    id: string;
    name: string;
  };
  teams: {
    home: {
      id: string;
      name: string;
    };
    away: {
      id: string;
      name: string;
    };
  };
  score?: string | null; 
  provider: string;     
  metadata?: IEventMetadata; 
  active: boolean;       
  
  createdAt?: Date;
  updatedAt?: Date;
}

