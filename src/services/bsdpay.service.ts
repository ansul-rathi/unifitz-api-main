import { Service, Container } from "typedi";
import { Logger } from "winston";
import axios from "axios";
import crypto from "crypto";
import { bsdPayConfig } from "@config/constants";
import { ServiceResponse } from "@interfaces/service-response.interface";
import {
  BSDPayCurrencyType,
  BSDPaymentOrderQueryRequest,
  BSDPaymentOrderQueryResponse,
  BSDPaymentPaymentNotification,
  BSDPaymentSubmitProofRequest,
  BSDPayWithdrawStatus,
} from "@interfaces/bsdpayment.interface";
import { BSDPayWithdrawalModel } from "../models/bsdpay-withdrawal.model";

@Service()
export class BSDPaymentService {
  private logger: Logger = Container.get("logger");
  private apiUrl: string = bsdPayConfig.apiUrl;
  private accessKey: string = bsdPayConfig.accessKey;
  private accessSecret: string = bsdPayConfig.accessSecret;

  /**
   * Generates a signature for BSD Pay API requests based on their documentation
   * 1. Concatenate parameters in order: method & url & accessKey & timestamp & nonce
   * 2. Create HMAC-SHA256 using accessSecret as key
   * 3. Base64 encode the result
   */
  private generateSignature(
    method: string,
    path: string,
    timestamp: number,
    nonce: string
  ): string {
    // Format path to remove protocol, domain name, and parameters
    const url = path.startsWith("/") ? path : `/${path}`;

    // Concatenate parameters in specified order
    const signString = `${method.toUpperCase()}&${url}&${this.accessKey}&${timestamp}&${nonce}`;

    console.log(`BSD Pay signature string: ${signString}`);

    // Create HMAC using SHA256 with accessSecret as key
    const hmac = crypto.createHmac("sha256", this.accessSecret);

    // Update HMAC with the signature string
    hmac.update(signString);

    // Get the digest in base64 format
    return hmac.digest("base64");
  }

  /**
   * Creates the common headers required for all BSD Pay API requests
   */
  private createHeaders(method: string, path: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const nonce = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random number

    const sign = this.generateSignature(method, path, timestamp, nonce);

    return {
      "Content-Type": "application/json",
      accessKey: this.accessKey,
      timestamp: timestamp.toString(),
      nonce: nonce,
      sign: sign,
    };
  }

  /**
   * Query merchant balance
   * Gets the balance information for all currencies
   */
  public async queryBalance(): Promise<ServiceResponse> {
    try {
      const path = "/api/merchant/Balance";
      const headers = this.createHeaders("GET", path);
      console.log({ headers });

      this.logger.info(
        `BSD Pay balance query request headers: ${JSON.stringify(headers)}`
      );

      // Make API call to BSD Pay
      const response = await axios.get(`${this.apiUrl}${path}`, { headers });
      console.log("response: ", response.data);

      this.logger.info(
        `BSD Pay balance query response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        return {
          success: true,
          message: "Balance query successful",
          data: {
            balances: response.data.result || [],
            timestamp: response.data.time,
          },
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Failed to query balance",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error querying BSD Pay balance:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to query balance",
        data: error.response?.data,
      };
    }
  }

  /**
   * Create a payment order for deposit
   */
  // public async createPaymentOrder(params: {
  //   reference: string;
  //   amount: string;
  //   customerName: string;
  //   customerEmail: string;
  //   customerPhone: string;
  //   payMethod: string;
  //   currency?: string;
  //   productName?: string;
  //   productDesc?: string;
  // }): Promise<ServiceResponse> {
  //   try {
  //     const path = "/api/merchant/CreateOrder";
  //     const headers = this.createHeaders("POST", path);

  //     const requestData = {
  //       orderNo: params.reference,
  //       amount: parseFloat(params.amount),
  //       currency: params.currency || "INR",
  //       method: params.payMethod,
  //       callbackUrl: bsdPayConfig.notifyUrl,
  //       returnUrl: bsdPayConfig.redirectUrl,
  //       customerName: params.customerName,
  //       customerEmail: params.customerEmail,
  //       customerPhone: params.customerPhone,
  //       productName: params.productName || "Unifitz Deposit",
  //       productDesc: params.productDesc || "Deposit funds to Unifitz account",
  //     };

  //     this.logger.info(
  //       `BSD Pay create order request: ${JSON.stringify(requestData)}`
  //     );

  //     // Make API call to BSD Pay
  //     const response = await axios.post(`${this.apiUrl}${path}`, requestData, {
  //       headers,
  //     });

  //     this.logger.info(
  //       `BSD Pay create order response: ${JSON.stringify(response.data)}`
  //     );

  //     if (response.data && response.data.code === 200) {
  //       return {
  //         success: true,
  //         message: "Payment order created successfully",
  //         data: {
  //           payUrl: response.data.data.paymentUrl,
  //           orderId: response.data.data.orderId,
  //           amount: response.data.data.amount,
  //           currency: response.data.data.currency,
  //           ...response.data.data,
  //         },
  //       };
  //     } else {
  //       return {
  //         success: false,
  //         message: response.data?.msg || "Failed to create payment order",
  //         data: response.data,
  //       };
  //     }
  //   } catch (error: any) {
  //     this.logger.error(
  //       "Error creating BSD Pay order:",
  //       error.response?.data || error.message
  //     );
  //     return {
  //       success: false,
  //       message: error.message || "Failed to create payment order",
  //       data: error.response?.data,
  //     };
  //   }
  // }

  /**
   * Query payment order status
   */
  public async queryPaymentOrder(reference: string): Promise<ServiceResponse> {
    try {
      const path = "/api/merchant/QueryOrder";
      const headers = this.createHeaders("GET", path);

      // Make API call to BSD Pay
      const response = await axios.get(
        `${this.apiUrl}${path}?orderNo=${reference}`,
        { headers }
      );

      this.logger.info(
        `BSD Pay query order response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        return {
          success: true,
          message: "Payment order query successful",
          data: {
            status: response.data.data.status,
            amount: response.data.data.amount,
            currency: response.data.data.currency,
            orderId: response.data.data.orderId,
            ...response.data.data,
          },
        };
      } else {
        return {
          success: false,
          message: response.data?.msg || "Failed to query payment order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error querying BSD Pay order:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to query payment order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Create a payout (withdrawal) order
   */
  public async createPayoutOrder(params: {
    reference: string;
    amount: string;
    bankCode: string;
    ifscCode: string;
    accountHolderName: string;
    accountNumber: string;
    email: string;
    phone: string;
    currency?: string;
  }): Promise<ServiceResponse> {
    try {
      const path = "/api/merchant/CreatePayout";
      const headers = this.createHeaders("POST", path);

      const requestData = {
        orderNo: params.reference,
        amount: parseFloat(params.amount),
        currency: params.currency || "INR",
        bankCode: params.bankCode,
        ifscCode: params.ifscCode,
        accountName: params.accountHolderName,
        accountNumber: params.accountNumber,
        callbackUrl: bsdPayConfig.payoutNotifyUrl,
        email: params.email,
        phone: params.phone,
      };

      this.logger.info(
        `BSD Pay create payout request: ${JSON.stringify(requestData)}`
      );

      // Make API call to BSD Pay
      const response = await axios.post(`${this.apiUrl}${path}`, requestData, {
        headers,
      });

      this.logger.info(
        `BSD Pay create payout response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        return {
          success: true,
          message: "Payout order created successfully",
          data: {
            transactionId: response.data.data.transactionId,
            orderId: response.data.data.orderId,
            amount: response.data.data.amount,
            currency: response.data.data.currency,
            ...response.data.data,
          },
        };
      } else {
        return {
          success: false,
          message: response.data?.msg || "Failed to create payout order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error creating BSD Pay payout:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to create payout order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Query payout order status
   */
  public async queryPayoutOrder(reference: string): Promise<ServiceResponse> {
    try {
      const path = "/api/merchant/QueryPayout";
      const headers = this.createHeaders("GET", path);

      // Make API call to BSD Pay
      const response = await axios.get(
        `${this.apiUrl}${path}?orderNo=${reference}`,
        { headers }
      );

      this.logger.info(
        `BSD Pay query payout response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        return {
          success: true,
          message: "Payout order query successful",
          data: {
            status: response.data.data.status,
            amount: response.data.data.amount,
            currency: response.data.data.currency,
            orderId: response.data.data.orderId,
            ...response.data.data,
          },
        };
      } else {
        return {
          success: false,
          message: response.data?.msg || "Failed to query payout order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error querying BSD Pay payout:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to query payout order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Query payment order status
   */
  public async queryOrderStatus(
    orderNo: string,
    payerId: string
  ): Promise<ServiceResponse> {
    try {
      const requestData: BSDPaymentOrderQueryRequest = {
        OrderNo: orderNo,
        PayerId: payerId,
      };

      const response = await axios.post<BSDPaymentOrderQueryResponse>(
        `${this.apiUrl}/order/query`,
        requestData
      );

      if (response.data.code === 200) {
        return {
          success: true,
          message: "Order query successful",
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Failed to query order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error querying BSDPayment order:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to query order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Verify notification signature from BSD Pay
   */
  public verifyNotificationSignature(notification: any): boolean {
    try {
      const { accessKey, timestamp, nonce, sign } = notification;

      // Verify that the accessKey matches our accessKey
      if (accessKey !== this.accessKey) {
        this.logger.error("Invalid accessKey in notification");
        return false;
      }

      // Reconstruct the signature using the path that would have been used for the callback
      const path = "/api/callback/notification"; // Adjust this based on actual callback path
      const calculatedSign = this.generateSignature(
        "POST",
        path,
        parseInt(timestamp),
        nonce
      );

      return sign === calculatedSign;
    } catch (error) {
      this.logger.error(
        "Error verifying BSD Pay notification signature:",
        error
      );
      return false;
    }
  }

  /**
   * Validate notification from BSD Pay
   */
  public validateNotification(
    notification: BSDPaymentPaymentNotification
  ): ServiceResponse {
    // Check if signature is valid
    if (!this.verifyNotificationSignature(notification)) {
      return {
        success: false,
        message: "Invalid notification signature",
        data: null,
      };
    }

    return {
      success: true,
      message: "Notification validated successfully",
      data: notification,
    };
  }

  /**
   * Submit payment proof (UTR) for manual payments
   */
  public async submitPaymentProof(
    reference: string,
    proof: string,
    payerId: string
  ): Promise<ServiceResponse> {
    try {
      const path = "/api/merchant/SubmitProof";
      const headers = this.createHeaders("POST", path);

      const requestData: BSDPaymentSubmitProofRequest = {
        orderNo: reference,
        proof: proof,
        PayerId: payerId,
      };

      this.logger.info(
        `BSD Pay submit proof request: ${JSON.stringify(requestData)}`
      );

      // Make API call to BSD Pay
      const response = await axios.post(`${this.apiUrl}${path}`, requestData, {
        headers,
      });

      this.logger.info(
        `BSD Pay submit proof response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        return {
          success: true,
          message: "Payment proof submitted successfully",
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.msg || "Failed to submit payment proof",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error submitting BSD Pay proof:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to submit payment proof",
        data: error.response?.data,
      };
    }
  }

  /**
   * Query UPI status
   */
  public async queryUpi(upi: string): Promise<ServiceResponse> {
    try {
      const path = "/api/merchant/QueryUpi";
      const headers = this.createHeaders("GET", path);

      // Make API call to BSD Pay
      const response = await axios.get(`${this.apiUrl}${path}?upi=${upi}`, {
        headers,
      });

      this.logger.info(
        `BSD Pay query UPI response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        return {
          success: true,
          message: "UPI query successful",
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.msg || "Failed to query UPI",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error querying BSD Pay UPI:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to query UPI",
        data: error.response?.data,
      };
    }
  }

  /**
   * Generate a unique reference number for orders
   */
  public generateReferenceNumber(userId: string): string {
    // Format: BSD-{userId}-{timestamp}-{random}
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `BSD-${userId.substring(0, 8)}-${timestamp}-${random}`;
  }

  /**
   * Create a withdrawal/payout order with support for different currencies (INR, TRX, USDT)
   *
   * @param params Parameters for creating a withdrawal order
   * @returns Service response with the created withdrawal order details
   */
  public async createWithdraw(params: {
    userId: string; // User ID making the withdrawal
    merchantOrderNo: string; // Merchant order number, unique identifier
    amount: string; // Amount to withdraw (max 2 decimal places)
    type: BSDPayCurrencyType; // Currency type: inr, trx, usdt
    channelCode: string; // The channel code you bind
    address?: string; // Required for TRX or USDT payouts
    name?: string; // Beneficiary's name (required for INR)
    bankName?: string; // Bank name (required for INR)
    bankAccount?: string; // Bank account number (required for INR)
    ifsc?: string; // IFSC code (required for INR)
    notifyUrl?: string; // Address for order notification callbacks
    mainTransactionId?: string; // Reference to main transaction if applicable
  }): Promise<ServiceResponse> {
    try {
      const path = "/api/payorder/create";
      const headers = this.createHeaders("POST", path);

      // Validate required fields based on currency type
      if (params.type === BSDPayCurrencyType.INR) {
        if (
          !params.name ||
          !params.bankName ||
          !params.bankAccount ||
          !params.ifsc
        ) {
          return {
            success: false,
            message:
              "For INR withdrawals, name, bankName, bankAccount, and ifsc are required",
            data: null,
          };
        }
      } else if (
        params.type === BSDPayCurrencyType.TRX ||
        params.type === BSDPayCurrencyType.USDT
      ) {
        if (!params.address) {
          return {
            success: false,
            message: `For ${params.type.toUpperCase()} withdrawals, address is required`,
            data: null,
          };
        }
      }

      // Prepare request data
      const requestData = {
        McorderNo: params.merchantOrderNo,
        Amount: params.amount,
        Type: params.type,
        ChannelCode: params.channelCode,
        Address: params.address || "",
        name: params.name || "",
        BankName: params.bankName || "",
        BankAccount: params.bankAccount || "",
        Ifsc: params.ifsc || "",
        NotifyUrl: params.notifyUrl || bsdPayConfig.payoutNotifyUrl,
      };

      this.logger.info(
        `BSD Pay create withdraw request: ${JSON.stringify(requestData)}`
      );

      // Make API call to BSD Pay
      const response = await axios.post(`${this.apiUrl}${path}`, requestData, {
        headers,
      });

      console.log(
        `BSD Pay create withdraw response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        // Create database record for withdrawal
        const withdrawalRecord = new BSDPayWithdrawalModel({
          userId: params.userId,
          mainTransactionId: params.mainTransactionId || undefined,
          merchantOrderNo: params.merchantOrderNo,
          orderNo: response.data.result.orderNo,
          amount: parseFloat(params.amount),
          fee: response.data.result.fee || 0,
          type: params.type,
          channelCode: params.channelCode,
          status: response.data.result.status || BSDPayWithdrawStatus.CREATED,

          // INR-specific fields
          name: params.name,
          bankName: params.bankName,
          bankAccount: params.bankAccount,
          ifsc: params.ifsc,

          // Crypto-specific fields
          address: params.address,

          // Store the full response for reference
          responseData: response.data,

          // Initialize status change logs with creation event
          statusChangeLogs: [
            {
              previousStatus: "NA",
              newStatus:
                response.data.result.status || BSDPayWithdrawStatus.CREATED,
              changeDate: new Date(),
              metadata: { event: "create", time: response.data.time },
            },
          ],
        });

        await withdrawalRecord.save();
        this.logger.info(
          `Withdrawal record created in database: ${withdrawalRecord._id}`
        );

        return {
          success: true,
          message: "Withdrawal order created successfully",
          data: {
            withdrawalId: withdrawalRecord._id,
            orderNo: response.data.result.orderNo, // BSD Pay order number
            merchantOrderNo: response.data.result.merchantOrder, // Your reference number
            amount: response.data.result.amount, // Amount
            status: response.data.result.status, // Order status
            currency: response.data.result.currency, // Currency type
            fee: response.data.result.fee, // Fee charged
            timestamp: response.data.time, // Timestamp
          },
        };
      } else {
        return {
          success: false,
          message:
            response.data?.message || "Failed to create withdrawal order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error creating BSD Pay withdrawal:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to create withdrawal order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Query withdrawal/payout order status
   * This method checks the status of a previously created withdrawal order
   */
  public async queryWithdrawOrder(reference: string): Promise<ServiceResponse> {
    try {
      const path = "/api/payorder/queryorder";
      const headers = this.createHeaders("POST", path);

      // Make API call to BSD Pay
      const response = await axios.post(
        `${this.apiUrl}${path}`,
        {
          orderNo: reference,
        },
        { headers }
      );

      console.log(
        `BSD Pay query withdraw response: ${JSON.stringify(response.data)}`
      );

      if (response.data && response.data.code === 200) {
        // Map the status from BSD Pay to our system
        let status = "PENDING";
        if (response.data.result.status === "success") {
          status = "COMPLETED";
        } else if (
          response.data.result.status === "fail" ||
          response.data.result.status === "overrule"
        ) {
          status = "FAILED";
        }

        return {
          success: true,
          message: "Withdraw order query successful",
          data: {
            orderNo: response.data.result.orderNo,
            merchantOrderNo: response.data.result.merchantOrder,
            status: response.data.result.status,
            amount: response.data.result.amount,
            currency: response.data.result.currency,
            fee: response.data.result.fee,
            mappedStatus: status,
            timestamp: response.data.time,
          },
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Failed to query withdrawal order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error(
        "Error querying BSD Pay withdrawal:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.message || "Failed to query withdrawal order",
        data: error.response?.data,
      };
    }
  }
}
