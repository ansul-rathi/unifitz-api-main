export interface CreatePaymentRequest {
    userId: string;
    amount: number;
    paymentMethod: string;
    paymentProvider: string;
    currency?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    callbackUrl?: string;
    redirectUrl?: string;
    metadata?: Record<string, any>;
  }
  
  export interface CreateWithdrawalRequest {
    userId: string;
    amount: number;
    paymentProvider: string;
    bankCode?: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode?: string;
    currency?: string;
    email?: string;
    ticketId?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }
  
  export interface PaymentStatusResponse {
    transactionId?: string;
    reference: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    amount: string;
    currency: string;
    paymentUrl?: string;
    failReason?: string;
  }
  
  export enum PaymentProvider {
    HZPAYS = 'HZPAYS',
    BSD_PAYMENT = 'BSD_PAYMENT'
  }
  
  export enum PaymentMethod {
    UPI = 'UPI',
    BANK_TRANSFER = 'BANK_TRANSFER'
  }
  
  export enum TransactionType {
    // DEPOSIT = 'DEPOSIT',
    // WITHDRAWAL = 'WITHDRAWAL'
  }
  
  export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
  }