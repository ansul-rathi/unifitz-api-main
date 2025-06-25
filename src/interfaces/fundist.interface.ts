export interface IFundistBaseRequest {
  type: FundistRequestType;
  hmac: string;
}

export interface IFundistPingRequest extends IFundistBaseRequest {
  type: "ping";
}

export interface IFundistBalanceRequest extends IFundistBaseRequest {
  type: "balance";
  userid: string;
  currency: string;
  i_extparam: string;
  i_gamedesc: string; // Format: "{SystemID}:{GameType}"
}

export const FUNDIST_DEBIT_SUBTYPES = ['cancel', 'debit'] as const;
export type FundistDebitSubtype = typeof FUNDIST_DEBIT_SUBTYPES[number];
export interface IFundistDebitRequest extends IFundistBaseRequest {
    type: "debit";
    tid: string;                  // Unique Transaction ID, alphanumeric max 32 chars
    userid: string;               // User login parameter
    currency: string;    // Currency parameter
    amount: string;              // Amount to debit
    i_gameid: string;            // Game round ID, alphanumeric max 32 chars
    i_extparam: string;          // External parameter from AuthHTML
    i_gamedesc: string;          // Format: "{SystemID}:{GameType}", max 64 chars
    i_actionid: string;          // Game event reference ID
    round_start?: boolean;       // Optional: Indicates first transaction of round
    round_ended?: boolean;       // Optional: Marks round end
    game_extra?: string;         // Optional: Additional game information
    subtype?: FundistDebitSubtype; // Optional: For cancellation or specific game entry
    action_details?: string;     // Optional: Additional round information
    hmac: string;               // Hash generated from request params
  }
  export const FUNDIST_CREDIT_SUBTYPES = ['cancel', 'credit', 'promotion'] as const;
export type FundistCreditSubtype = typeof FUNDIST_CREDIT_SUBTYPES[number];

  export interface IFundistCreditRequest extends IFundistBaseRequest {
    type: "credit";
    tid: string;                         // Unique Transaction ID, alphanumeric max 32 chars
    userid: string;                      // User login parameter
    currency: string;                    // Currency parameter
    amount: string;                      // Amount to credit
    i_gameid: string;                   // Game round ID, alphanumeric max 32 chars
    i_extparam: string;                 // External parameter from AuthHTML
    i_gamedesc: string;                 // Format: "{SystemID}:{GameType}", max 64 chars
    i_actionid: string;                 // Action reference number
    
    // Optional parameters
    i_rollback?: string;                // Link to related debit request
    i_reference_actionid?: string;      // Action reference for bonus credit transactions
    game_extra?: string;                // PageCode for Evo or FREEROUNDS_XXX
    subtype?: FundistCreditSubtype;     // For cancellation or specific game exit
    round_start?: boolean;              // Indicates first transaction of round
    round_ended?: boolean;              // Marks round end
    jackpot_win?: 1;                    // Indicates jackpot win
    i_flag?: string;                    // Promo award flag
    action_details?: string;            // Additional round information
    hmac: string;                       // Hash generated from request params
  }

export interface IFundistBaseResponse {
  status: "OK" | "ERROR";
  hmac: string;
}

export interface IFundistPingResponse extends IFundistBaseResponse {
  status: "OK";
}

export interface IFundistBalanceResponse extends IFundistBaseResponse {
  status: "OK";
  balance: number;
}

export interface IFundistTransactionResponse extends IFundistBaseResponse {
  status: "OK";
  tid: string;
  balance: number;
}

export interface IFundistErrorResponse extends IFundistBaseResponse {
  status: "ERROR";
  error: string;
  code?: number;
}

export type FundistRequestType = "ping" | "balance" | "debit" | "credit" | "roundinfo";

export type FundistRequest =
  | IFundistPingRequest
  | IFundistBalanceRequest
  | IFundistDebitRequest
  | IFundistCreditRequest;

export type FundistResponse =
  | IFundistPingResponse
  | IFundistBalanceResponse
  | IFundistTransactionResponse
  | IFundistErrorResponse;


  export interface IFundistAddUserRequest {
    login: string;           // Max 29 chars, alphanumeric + _-
    password: string;        // Min 6 chars, can't contain login
    currency: string;        // Fixed after creation
    language: string;        // Language code
    registrationIP: string;  // IPv4 or IPv6
    tid: string;            // Transaction ID
    nick?: string;          // Optional nickname
    timezone?: number;      // -720 to +720 minutes
    name?: string;          // First name
    lastName?: string;      // Last name
    gender?: 'male' | 'female';
    phone?: string;
    alternativePhone?: string;
    country?: string;       // ISO 2 or 3 symbol code
    city?: string;
    address?: string;
    email?: string;
    dateOfBirth?: string;   // YYYY-MM-DD format
    affiliateId?: string;
  }

  export interface IGameLaunchRequest {
    login: string;
    password: string;
    system: string;
    page: string;
    userIp: string;
    currency?: string;
    country?: string;
    demo?: string;
    autoCreate?: boolean;
    language?: string;
    tid?: string;
  }

  export interface ILobbyStateRequest {
    tables: string[];
    tid?: string;
  }

  export enum GameSortingType {
    NEW = 'new',
    POPULAR = 'popular'
  }
  
  export interface IGameSortingRequest {
    type: GameSortingType;
    tid?: string;
  }
