export interface BetsApiResponse {
    success: number;
    pager?: {
      page: number;
      per_page: number;
      total: number;
    };
    stats?: {
      event_id: string;
    }
    results: any[]; 
  }
  export enum EventTimeStatus {
    NOT_STARTED = "NOT_STARTED",
    INPLAY = "INPLAY",
    TO_BE_FIXED = "TO_BE_FIXED",
    ENDED = "ENDED",
    POSTPONED = "POSTPONED",
    CANCELLED = "CANCELLED",
    WALKOVER = "WALKOVER",
    INTERRUPTED = "INTERRUPTED",
    ABANDONED = "ABANDONED",
    RETIRED = "RETIRED",
    SUSPENDED = "SUSPENDED",
    DECIDED_BY_FA = "DECIDED_BY_FA",
    REMOVED = "REMOVED"
  }
export  interface BetsApiEvent {
    id: string;
    sport_id: string;
    time: string;
    time_status: string;
    league: {
      id: string;
      name: string;
    };
    home: {
      id: string;
      name: string;
    };
    away: {
      id: string;
      name: string;
    };
    ss: string | null;
    our_event_id: string | null;
    r_id: string | null;
    updated_at: string;
    odds_updated_at: string;
  }