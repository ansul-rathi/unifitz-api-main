interface IBetTransaction {
  amount: number;
  betslip_id: string;
  bonus_id: string;
  currency: string;
  ext_player_id: string;
  id: string;
  operation: string;
  operator_brand_id: string;
  operator_id: string;
  player_id: string;
  timestamp: number;
}

interface IBet {
  competitor_name: string[];
  event_id: string;
  id: string;
  live: boolean;
  market_id: string;
  market_name: string;
  odds: string;
  outcome_name: string;
  scheduled: string;
  sport_id: string;
  tournament_id: string;
}
interface IExchangeBet extends IBet {
  backlay: 'b' | 'l';  // 'b' for back, 'l' for lay
}

interface IBetSlip {
  bets: IBet[];
  currency: string;
  ext_player_id: string;
  id: string;
  is_quick_bet: boolean;
  k: string;
  operator_brand_id: string;
  operator_id: string;
  player_id: string;
  sum: number;
  timestamp: number;
  type: string;
}
interface IExchangeBetSlip extends IBetSlip {
  bets: IExchangeBet[];
}
export interface IExchangeBetRequest {
  betslip: IExchangeBetSlip;
  potential_win: number;
  token: string;
  transaction: IBetTransaction;
}

export interface IBetRequest {
  betslip: IBetSlip;
  potential_win: number;
  token: string;
  transaction: IBetTransaction;
}

interface ISelections {
  bet_id: string;
  betslip_id: string;
  profit: string;
  status: string;
}

interface IBetSlipSettle {
  bet_slip_id: string;
  commission: string;
  trade_profit: string;
}

export interface ISettlementRequest {
  bet_slip_settle: IBetSlipSettle;
  bonus_id: string;
  bonus_type: string;
  is_cashout: boolean;
  selections: ISelections;
  token: string;
  transaction: IBetTransaction;
  is_payout: boolean;
}

interface IExchangeSelection {
  bet_id: string;
  betslip_id: string;
  profit: string;
  status: 'win' | 'lost';
}

export interface IExchangeSettlementRequest {
  bet_slip_settle: {
    bet_slip_id: string;
    commission: string;
    trade_profit: string;
  };
  selections: IExchangeSelection[];
  token: string;
  transaction: IBetTransaction;
}

interface IRollbackSelection {
  bet_id: string;
  betslip_id: string;
  status: 'open';
}

export interface IRollbackRequest {
  selections: IRollbackSelection[];
  token: string;
  transaction: IBetTransaction;
  target_type?: 'exchange' | 'sportsbook';
}

export interface IBonusPayoutRequest {
  bonus_id: string;
  reason: string;
  selections: Array<{
    bet_id: string;
    betslip_id: string;
    status: string;
  }>;
  token: string;
  transaction: IBetTransaction;
}

