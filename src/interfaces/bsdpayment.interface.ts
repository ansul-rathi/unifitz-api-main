export interface BSDPaymentRequestBase {
    McorderNo: string; // Merchant order number
  }
  
  // Create payment on behalf of others
  export interface BSDPaymentPaymentCreateRequest extends BSDPaymentRequestBase {
    Amount: string;
    Type: string; // Currency type, e.g., "inr"
    ChannelCode: string; // Channel code bound
    Address?: string; // Valid for trx or usdt payment
    name?: string; // Payee name (inr valid)
    BankName?: string; // Bank name (inr valid)
    BankAccount?: string; // Bank card number (inr valid)
    Ifsc?: string; // IFSC (inr valid)
    NotifyUrl: string;
  }
  
  // Withdraw/Payout request (BSD Pay)
  export interface BSDPaymentWithdrawRequest {
    McorderNo: string;     // Merchant order number, unique identifier
    Amount: string;        // Amount to withdraw (max 2 decimal places)
    Type: string;          // Currency type: inr, trx, usdt
    ChannelCode: string;   // The channel code you bind
    Address?: string;      // Required for TRX or USDT payouts
    name?: string;         // Beneficiary's name (required for INR)
    BankName?: string;     // Bank name (required for INR)
    BankAccount?: string;  // Bank account number (required for INR)
    Ifsc?: string;         // IFSC code (required for INR)
    NotifyUrl?: string;    // Address for order notification callbacks
  }
  
  // Withdraw/Payout response (BSD Pay)
  export interface BSDPaymentWithdrawResponse {
    orderNo: string;        // BSD Pay order number
    merchantOrder: string;  // Your reference number
    amount: number;         // Amount
    status: string;         // Order status
    currency: string;       // Currency type
    fee: number;            // Fee charged
  }
  
  // Order query request
  export interface BSDPaymentOrderQueryRequest {
    OrderNo: string;
    PayerId: string;
  }
  
  // Order detail query request
  export interface BSDPaymentOrderDetailRequest {
    OrderNo: string;
    PayerId: string;
  }
  
  // Query UPI request
  export interface BSDPaymentQueryUpiRequest {
    upi: string;
  }
  
  // Submit UTR proof
  export interface BSDPaymentSubmitProofRequest {
    orderNo: string;
    proof: string;
    PayerId: string;
  }
  
  // Payment notification response
  export interface BSDPaymentPaymentNotification {
    orderno: string; // Order ID
    merchantorder: string; // Merchant order number
    amount: string; // Transaction amount
    fee: string; // Payment collection fee
    proof: string; // UTR for credentials inr, hash for TRON
    status: 'success' | 'fail'; // Status
    createtime: string; // Creation time
    updatetime: string; // Last update time
  }
  
  export interface BSDPaymentResponse {
    code: number;
    message: string;
    data?: any;
  }
  
  export interface BSDPaymentOrderQueryResponse extends BSDPaymentResponse {
    data?: {
      orderid: string;
      mcorderno: string;
      amount: string;
      status: string;
      createtime: string;
      updatetime: string;
      payerupi?: string;
      payername?: string;
    };
  }
  
  export enum BSDPaymentPaymentChannel {
    UPI_PAYMENT = '71001',
    BANK_TRANSFER = '71002'
  }


  // Currency types supported by BSD Pay
  export enum BSDPayCurrencyType {
    INR = "inr",  // Rupee
    TRX = "trx",  // TRON TRX
    USDT = "usdt" // Tron USDT
  }
  
  // Status descriptions for payout orders
  export enum BSDPayWithdrawStatus {
    CREATED = "created",   // Created
    WAITING = "waiting",   // Waiting for processing
    PAYING = "paying",     // Payment in progress  
    SUCCESS = "success",   // Success
    FAIL = "fail",         // Failed
    OVERRULE = "overrule"  // Rejected
  }