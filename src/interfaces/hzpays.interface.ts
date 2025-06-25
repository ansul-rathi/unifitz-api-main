export interface HZPaysRequestBase {
  merchantId: string;
  sign: string;
}

export interface HZPaysPayinOrderCreateRequest extends HZPaysRequestBase {
  eventType: 'payin.order.create';
  reference: string;
  amount: string;
  currency: string;
  payMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notifyUrl: string;
  redirectUrl?: string;
  productName?: string;
  productDesc?: string;
  idType?: string;
  idNumber?: string;
  userAccount?: string;
  userBankCode?: string;
}

export interface HZPaysPayinOrderQueryRequest extends HZPaysRequestBase {
  eventType: 'payin.order.query';
  reference: string;
}

// Payout (Withdrawal) Request
export interface HZPaysPayoutOrderCreateRequest extends HZPaysRequestBase {
  eventType: 'payout.order.create';
  reference: string;
  amount: string;
  currency: string;
  bankCode: string;  // Beneficiary bank number
  name: string;      // Beneficiary's name
  accountNumber: string;  // Beneficiary account number
  notifyUrl: string;
  email?: string;
  phone?: string;
  province?: string;
  city?: string;
  idType?: string;
  idNumber?: string;
  accountType?: string;
  transferType?: string;
}

// Payout (Withdrawal) Query
export interface HZPaysPayoutOrderQueryRequest extends HZPaysRequestBase {
  eventType: 'payout.order.query';
  reference: string;
}

// Balance Query
export interface HZPaysBalanceQueryRequest extends HZPaysRequestBase {
  eventType: 'balance.query';
}

export interface HZPaysResponse {
  statusCode: 'success' | 'fail';
  statusMessage: string;
  merchantId: string;
  reference?: string;
  transactionId?: string;
  amount?: string;
  payUrl?: string;
  extInfo?: string;
}

export interface HZPaysBalanceResponse extends HZPaysResponse {
  currency: { [key: string]: string };  // Currency to balance mapping
}

export interface HZPaysPayoutResponse extends HZPaysResponse {
  transactionId: string;
}

export interface HZPaysPayoutQueryResponse extends HZPaysResponse {
  reference: string;
  transactionId: string;
  state: 'success' | 'fail' | 'waiting';
  amount: string;
  realAmount: string;
  currency: string;
}

export interface HZPaysPayoutNotificationRequest extends HZPaysRequestBase {
  merchantId: string;
  reference: string;
  transactionId: string;
  amount: string;
  realAmount: string;
  currency: string;
  state: 'success' | 'fail';
  failReason?: string;  // Only present for failures, not included in signature
  proofUrl?: string;    // Proof of payment (e.g., Indian UTR)
}

export interface HZPaysNotificationRequest extends HZPaysRequestBase {
  merchantId: string;
  reference: string;
  transactionId: string;
  amount: string;
  currency: string;
  statusCode: 'success' | 'fail';
  failReason?: string;
  orderTime: string;
  completionTime: string;
  payMethod: string;
}

export enum HZPaysPayMethod {
  NATIVE_INDIA = '11001',
  UPI_INDIA = '11002',
  INDIA_WAKE_UP = '11003'
}