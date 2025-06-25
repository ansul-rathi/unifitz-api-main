import { Service, Container } from "typedi";
import { Logger } from "winston";
import axios from "axios";
import crypto from "crypto";
import { hzPaysConfig } from "@config/constants";
import {
  HZPaysNotificationRequest,
  HZPaysPayinOrderCreateRequest,
  HZPaysPayinOrderQueryRequest,
  HZPaysResponse,
  HZPaysBalanceQueryRequest,
  HZPaysBalanceResponse,
  HZPaysPayoutOrderCreateRequest,
  HZPaysPayoutOrderQueryRequest,
  HZPaysPayoutResponse,
  HZPaysPayoutQueryResponse,
  HZPaysPayoutNotificationRequest
} from "@interfaces/hzpays.interface";
import { ServiceResponse } from "@interfaces/service-response.interface";

@Service()
export class HZPaysService {
  private logger: Logger = Container.get("logger");
  private apiUrl: string = hzPaysConfig.apiUrl;

  /**
   * Generates a signature for HZPays API requests based on their documentation
   * 1. Sort parameters by ASCII code of parameter name
   * 2. Concatenate as key1=value1&key2=value2 format
   * 3. Append the API key (no & separator)
   * 4. Generate MD5 hash in lowercase
   */
  private generateSignature(params: Record<string, any>): string {
    // Remove null/undefined values and sign parameter
    const filteredParams = Object.keys(params)
      .filter(key => params[key] !== null && params[key] !== undefined && key !== 'sign' && key !== 'failReason')
      .reduce((obj: Record<string, any>, key) => {
        obj[key] = params[key];
        return obj;
      }, {});

    // Sort params by key name (ASCII order)
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // Build key-value string
    const stringA = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
      .join("&");
    
    // Append API key directly to stringA to get stringB
    const stringB = stringA + hzPaysConfig.apiKey;

    // Generate MD5 hash in lowercase
    return crypto.createHash("md5").update(stringB).digest("hex").toLowerCase();
  }

  /**
   * Create a payment order for deposit
   */
  public async createPaymentOrder(params: {
    reference: string;
    amount: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    payMethod: string;
    currency?: string;
    productName?: string;
    productDesc?: string;
  }): Promise<ServiceResponse> {
    try {
      const requestData: HZPaysPayinOrderCreateRequest = {
        merchantId: hzPaysConfig.merchantId,
        eventType: "payin.order.create",
        reference: params.reference,
        amount: params.amount,
        currency: params.currency || "INR",
        payMethod: params.payMethod,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        notifyUrl: hzPaysConfig.notifyUrl,
        redirectUrl: hzPaysConfig.redirectUrl,
        productName: params.productName || "Unifitz Deposit",
        productDesc: params.productDesc || "Deposit funds to Unifitz account",
        sign: "" // Placeholder, will be filled below
      };

      // Generate signature
      requestData.sign = this.generateSignature(requestData);

      this.logger.info(`HZPays API request: ${JSON.stringify(requestData)}`);

      // Make API call to HZPays
      const response = await axios.post<HZPaysResponse>(
        this.apiUrl,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.info(`HZPays API response: ${JSON.stringify(response.data)}`);

      if (response.data.statusCode === "success") {
        return {
          success: true,
          message: "Payment order created successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.statusMessage || "Failed to create payment order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error("Error creating HZPays payment order:", error.response?.data || error.message);
      return {
        success: false,
        message: error.message || "Failed to create payment order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Query payment order status
   */
  public async queryPaymentOrder(reference: string): Promise<ServiceResponse> {
    try {
      const requestData: HZPaysPayinOrderQueryRequest = {
        merchantId: hzPaysConfig.merchantId,
        eventType: "payin.order.query",
        reference,
        sign: "" // Placeholder, will be filled below
      };

      // Generate signature
      requestData.sign = this.generateSignature(requestData);

      // Make API call to HZPays
      const response = await axios.post<HZPaysResponse>(
        this.apiUrl,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.statusCode === "success") {
        return {
          success: true,
          message: "Payment order query successful",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.statusMessage || "Failed to query payment order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error("Error querying HZPays payment order:", error.response?.data || error.message);
      return {
        success: false,
        message: error.message || "Failed to query payment order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Verify notification signature from HZPays
   */
  public verifyNotificationSignature(notification: HZPaysNotificationRequest): boolean {
    const receivedSign = notification.sign;
    
    // Generate signature using same algorithm
    const calculatedSign = this.generateSignature(notification);
    
    return receivedSign === calculatedSign;
  }

  /**
   * Process payment notification from HZPays
   */
  public validateNotification(notification: HZPaysNotificationRequest): ServiceResponse {
    // Check if signature is valid
    if (!this.verifyNotificationSignature(notification)) {
      return {
        success: false,
        message: "Invalid notification signature",
        data: null,
      };
    }

    // Check merchant ID
    if (notification.merchantId !== hzPaysConfig.merchantId) {
      return {
        success: false,
        message: "Invalid merchant ID",
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
   * Generate a unique reference number for orders
   */
  public generateReferenceNumber(userId: string): string {
    // Format: HZ-{userId}-{timestamp}-{random}
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HZ-${userId.substring(0, 8)}-${timestamp}-${random}`;
  }

  /**
   * Query account balance
   */
  public async queryAccountBalance(): Promise<ServiceResponse> {
    try {
      const requestData: HZPaysBalanceQueryRequest = {
        merchantId: hzPaysConfig.merchantId,
        eventType: "balance.query",
        sign: "" // Placeholder, will be filled below
      };

      // Generate signature
      requestData.sign = this.generateSignature(requestData);

      this.logger.info(`HZPays balance query request: ${JSON.stringify(requestData)}`);

      // Make API call to HZPays
      const response = await axios.post<HZPaysBalanceResponse>(
        this.apiUrl,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.info(`HZPays balance query response: ${JSON.stringify(response.data)}`);

      if (response.data.statusCode === "success") {
        return {
          success: true,
          message: "Account balance query successful",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.statusMessage || "Failed to query account balance",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error("Error querying HZPays account balance:", error.response?.data || error.message);
      return {
        success: false,
        message: error.message || "Failed to query account balance",
        data: error.response?.data,
      };
    }
  }

  /**
   * Create a payout (withdrawal) order
   */
  public async createPayoutOrder(params: HZPaysPayoutOrderCreateRequest): Promise<ServiceResponse> {
    try {
      // Set the merchantId and notifyUrl from config
      const requestData: HZPaysPayoutOrderCreateRequest = {
        ...params,
        merchantId: hzPaysConfig.merchantId,
        notifyUrl: hzPaysConfig.payoutNotifyUrl,
        sign: "" // Placeholder, will be filled below
      };

      // Generate signature
      requestData.sign = this.generateSignature(requestData);

      this.logger.info(`HZPays payout order request: ${JSON.stringify(requestData)}`);

      console.log({requestData})
      // Make API call to HZPays
      const response = await axios.post<HZPaysPayoutResponse>(
        this.apiUrl,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.info(`HZPays payout order response: ${JSON.stringify(response.data)}`);

      if (response.data.statusCode === "success") {
        return {
          success: true,
          message: "Payout order created successfully",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.statusMessage || "Failed to create payout order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error("Error creating HZPays payout order:", error.response?.data || error.message);
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
      const requestData: HZPaysPayoutOrderQueryRequest = {
        merchantId: hzPaysConfig.merchantId,
        eventType: "payout.order.query",
        reference,
        sign: "" // Placeholder, will be filled below
      };

      // Generate signature
      requestData.sign = this.generateSignature(requestData);

      this.logger.info(`HZPays payout order query request: ${JSON.stringify(requestData)}`);

      // Make API call to HZPays
      const response = await axios.post<HZPaysPayoutQueryResponse>(
        this.apiUrl,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.info(`HZPays payout order query response: ${JSON.stringify(response.data)}`);

      if (response.data.statusCode === "success") {
        return {
          success: true,
          message: "Payout order query successful",
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.statusMessage || "Failed to query payout order",
          data: response.data,
        };
      }
    } catch (error: any) {
      this.logger.error("Error querying HZPays payout order:", error.response?.data || error.message);
      return {
        success: false,
        message: error.message || "Failed to query payout order",
        data: error.response?.data,
      };
    }
  }

  /**
   * Verify payout notification signature from HZPays
   */
  public verifyPayoutNotificationSignature(notification: HZPaysPayoutNotificationRequest): boolean {
    const receivedSign = notification.sign;
    
    // Generate signature using same algorithm
    const calculatedSign = this.generateSignature(notification);
    
    return receivedSign === calculatedSign;
  }

  /**
   * Validate payout notification from HZPays
   */
  public validatePayoutNotification(notification: HZPaysPayoutNotificationRequest): ServiceResponse {
    // Check if signature is valid
    if (!this.verifyPayoutNotificationSignature(notification)) {
      return {
        success: false,
        message: "Invalid payout notification signature",
        data: null,
      };
    }

    // Check merchant ID
    if (notification.merchantId !== hzPaysConfig.merchantId) {
      return {
        success: false,
        message: "Invalid merchant ID",
        data: null,
      };
    }

    return {
      success: true,
      message: "Payout notification validated successfully",
      data: notification,
    };
  }
}