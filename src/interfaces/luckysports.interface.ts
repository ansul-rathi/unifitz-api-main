export interface ITransactionItem {
  id: string; // A unique transaction identifier assigned by LuckySports.
  betslip_id: string; // A unique identifier for the bet slip assigned by LuckySports.
  player_id: string; // A unique identifier for the player assigned by LuckySports.
  operator_id: string; // A unique identifier for the partner.
  operator_brand_id: string; // A unique identifier for the partner website.
  ext_player_id: string; // A unique identifier for the player assigned by the partner.
  timestamp: number; // The time of the transaction in Unix timestamp format, measured in milliseconds.
  amount: number; // The amount deducted from or added to the player's account, represented as the actual number multiplied by 100.
  currency: string; // The currency used by the player.
  operation: string; // The action represented by this transaction.
  bonus_id?: string; // The bonus ID associated with the transaction, if applicable.
}

export interface IBetItem {
  id: string; // A unique identifier assigned by LuckySports for the bet selection.
  sport_id: string; // The unique identifier for the sport.
  event_id: string; // The unique identifier for the event.
  tournament_id: string; // The unique identifier for the league.
  category_id: string; // The unique identifier for the country to which the league belongs.
  live: boolean; // The status of the match at the time of betting, true for live, false for pre-match.
  sport_name: string; // The name of the sport.
  category_name: string; // The name of the country to which the league belongs.
  tournament_name: string; // The name of the league.
  competitor_name: string[]; // An array of competitor names.
  market_id: string; // The unique identifier for the market.
  market_name: string; // The name of the market.
  outcome_name: string; // The result of the bet.
  scheduled: string; // The start time of the match in datetime format to milliseconds.
  odds: string; // The betting odds.
  backlay: string; // Only used for exchange (indicates whether the bet is a back or lay bet).
  line: number; // Only used for exchange (refers to a specific type of betting line).
}

export interface IBetSlipItem {
  id: string; // A unique bet slip identifier assigned by LuckySports at the time of betting.
  betslipID: string; // A unique bet slip identifier assigned by LuckySports.
  timestamp: number; // Time represented in Unix timestamp format.
  player_id: string; // A unique identifier assigned to the player by LuckySports.
  operator_id: string; // A unique identifier for the partner.
  operator_brand_id: string; // A unique identifier for the partner's website.
  ext_player_id: string; // A unique identifier assigned to the player by the partner.
  currency: string; // The currency used by the player.
  type: string; // In the sportsbook, bet types can be single, treble, or double.
  sum: number; // In the exchange market, the bet type must be single.
  k: string; // The total amount wagered.
  bets: IBetItem[];
}

export interface IMakeBetRequest {
  transaction: ITransactionItem;
  betslip: IBetSlipItem;
  potential_win: number;
}

export interface IMakeBetResponseData {
  id: string; // Unique transaction identifier assigned by the partner. If not provided, can be the same as data.transaction.id.
  ext_transaction_id: string; // Unique transaction identifier assigned by LuckySports. Equivalent to data.transaction.id.
  user_id: string; // Unique player identifier provided by the partner. Equivalent to data.transaction.ext_player_id.
  operation: string; // The action represented by this transaction. Refer to OperationCode for possible actions.
  amount: number; // The amount deducted from the player's account, represented as the actual amount multiplied by 100. Negative value indicates an increase in balance (only for exchange). Example: 30012 → Deducts 300.12; -50028 → Increases 500.28.
  currency: string; // The currency used by the player. Equivalent to data.transaction.currency.
  balance: number; // The user's balance after the transaction, represented as the actual amount multiplied by 100.
}

export interface IMakeBetResponse {
  success: boolean;
  message: string;
  data: IMakeBetResponseData;
}


/**
 * Base response interface for Lucky Sports transactions
 */
export interface ISettelmentResponseData {
  /**
   * Unique transaction identifier assigned by the partner
   * Can be the same as data.transaction.id if custom identifier not needed
   */
  id: string;

  /**
   * Unique transaction identifier assigned by LuckySports
   * Equivalent to data.transaction.id
   */
  ext_transaction_id: string;

  /**
   * Unique player identifier provided by the partner
   * Equivalent to data.transaction.ext_player_id
   */
  user_id: string;

  /**
   * The action represented by this transaction
   */
  operation: string;

  /**
   * Transaction amount in cents (amount * 100)
   * Negative values indicate balance increase (exchange only)
   * Example: 30012 = 300.12 deduction, -50028 = 500.28 increase
   */
  amount: number;

  /**
   * User's balance after transaction in cents (balance * 100)
   */
  balance: number;
}

export interface ISettelmentResponse {
  success: boolean;
  message: string;
  data: ISettelmentResponseData;
}


export interface ITradeListParams {
  market_type?: 'MATCH_ODDS' | 'MATCH_ODDS_NC' | 'TOTAL_FANCY';
  order_status?: string;
  event_type_ids?: string;
  trade_ids?: string;
  update_date_dt_range_start?: string;
  update_date_dt_range_end?: string;
  re_settle?: boolean;
  user_ids?: string;
  player_ids?: string;
  event_ids?: string;
  market_ids?: string;
  place_order_ids?: string;
  record_count?: number;
  page?: number;
}