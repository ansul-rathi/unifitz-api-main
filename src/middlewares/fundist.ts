import { FUNDIST_CREDIT_SUBTYPES, FUNDIST_DEBIT_SUBTYPES, IFundistCreditRequest, IFundistDebitRequest } from "@interfaces/fundist.interface";
import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "http-status-codes";



export default function fundistAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | any> => {
    try {
      // Ensure request has hmac
      if (!req.body.hmac) {
        return res.status(HttpStatusCodes.UNAUTHORIZED).json({
          status: 'ERROR',
          error: 'Missing HMAC',
          code: HttpStatusCodes.UNAUTHORIZED
        });
      }

      // Let the service handle HMAC validation
      next();
    } catch (error) {
      return res.status(HttpStatusCodes.UNAUTHORIZED).json({
        status: 'ERROR',
        error: 'Authentication failed',
        code: HttpStatusCodes.UNAUTHORIZED
      });
    }
  };
}

export const validateDebitRequest = (request: IFundistDebitRequest): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate required fields
  if (!request.tid || request.tid.length > 32) {
    errors.push('Invalid tid: Must be present and max 32 characters');
  }

  if (!request.i_gameid || request.i_gameid.length > 32) {
    errors.push('Invalid i_gameid: Must be present and max 32 characters');
  }

  if (!request.i_gamedesc || request.i_gamedesc.length > 64) {
    errors.push('Invalid i_gamedesc: Must be present and max 64 characters');
  }

  // Validate currency
  // if (!FUNDIST_CURRENCIES.includes(request.currency as FundistCurrency)) {
  //   errors.push(`Invalid currency: Must be one of ${FUNDIST_CURRENCIES.join(', ')}`);
  // }

  // Validate amount format
  if (!/^\d+(\.\d{1,2})?$/.test(request.amount)) {
    errors.push('Invalid amount: Must be a valid number with up to 2 decimal places');
  }

  // Validate subtype if present
  if (request.subtype && !FUNDIST_DEBIT_SUBTYPES.includes(request.subtype)) {
    errors.push(`Invalid subtype: Must be one of ${FUNDIST_DEBIT_SUBTYPES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCreditRequest = (request: IFundistCreditRequest): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate required fields
  if (!request.tid || request.tid.length > 32) {
    errors.push('Invalid tid: Must be present and max 32 characters');
  }

  if ((!request.i_gameid || request.i_gameid.length > 32) && request.subtype !== 'promotion') {
    errors.push('Invalid i_gameid: Must be present and max 32 characters');
  }

  if ((!request.i_gamedesc || request.i_gamedesc.length > 64) && request.subtype !== 'promotion') {
    errors.push('Invalid i_gamedesc: Must be present and max 64 characters');
  }

  if (!request.i_actionid && request.subtype !== 'promotion') {
    errors.push('i_actionid is required');
  }

  // Validate amount format
  if (!/^\d+(\.\d{1,2})?$/.test(request.amount)) {
    errors.push('Invalid amount: Must be a valid number with up to 2 decimal places');
  }

  // Validate subtype if present
  if (request.subtype && !FUNDIST_CREDIT_SUBTYPES.includes(request.subtype)) {
    errors.push(`Invalid subtype: Must be one of ${FUNDIST_CREDIT_SUBTYPES.join(', ')}`);
  }

  // Validate jackpot_win if present
  if (request.jackpot_win !== undefined && request.jackpot_win !== 1) {
    errors.push('Invalid jackpot_win: Must be 1 when present');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};