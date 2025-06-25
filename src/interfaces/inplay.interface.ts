export interface IInplayEvent {
    id: string;
    sportId: string;
    competitionId: string;
    homeTeam: string;
    awayTeam: string;
    startTime: Date;
    score?: string;
    status: string;
    markets: IMarket[];
  }
  
  export interface IInplayBet {
    eventId: string;
    selectionId: string;
    amount: number;
    odds: number;
    userId: string;
  }
  
  export interface IMarket {
    id: string;
    name: string;
    selections: ISelection[];
  }
  
  export interface ISelection {
    id: string;
    name: string;
    odds: number;
  }