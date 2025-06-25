import { Document } from "mongoose";

export interface IWallet extends Document {
    _id: string;
  userId: string;
  balance: number;
  holdBalance: number;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  lastTransactionAt?: Date;
}

export interface IStaffWalletOperation {
  /**
   * The ID of the user whose wallet is being operated on
   */
  userId: string;

  /**
   * The amount to deposit or withdraw
   * Must be a positive number
   */
  amount: number;

  /**
   * Description of the operation
   * Used for audit and tracking purposes
   */
  description: string;

  /**
   * ID of the staff member performing the operation
   */
  staffId: string;

  /**
   * Optional reference number for external tracking
   */
  reference?: string;

  paymentTxnId?: string;

  holdLedgerTransactionId?: string;
  ticketId?: string;  // Optional ticket ID for resolution
  ticketResolution?: {
    status: 'CLOSED';
    comment: string;
  };

  /**
   * Optional metadata for additional information
   */
  metadata?: Record<string, any>;
}
