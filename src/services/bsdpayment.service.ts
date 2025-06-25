// import { Service, Container } from "typedi";
// import axios from "axios";
// import crypto from "crypto";
// import { Logger } from "winston";
// import { ServiceResponse } from "../interfaces/service-response.interface";
// import {
//   BSDPaymentPaymentCreateRequest,
//   BSDPaymentOrderQueryRequest,
//   BSDPaymentOrderDetailRequest,
//   BSDPaymentQueryUpiRequest,
//   BSDPaymentSubmitProofRequest,
//   BSDPaymentResponse,
//   BSDPaymentOrderQueryResponse,
//   BSDPaymentPaymentNotification
// } from "../interfaces/bsdpayment.interface";

// @Service()
// export class BSDPaymentService {
//   private logger: Logger = Container.get("logger");
//   private apiUrl: string = process.env.MERCHANT2_API_URL || 'http://localhost:5005/api';
//   private accessKey: string = process.env.MERCHANT2_ACCESS_KEY || '';
//   private secretKey: string = process.env.MERCHANT2_SECRET_KEY || '';
  
//   /**
//    * Generate HMAC signature for API requests
//    */
//   private generateHmacSignature(timestamp: string, nonce: string): string {
//     const message = `${this.accessKey}${timestamp}${nonce}`;
//     return crypto.createHmac('sha256', this.secretKey).update(message).digest('base64');
//   }

//   /**
//    * Generate request headers with authentication
//    */
//   private getAuthHeaders(): Record<string, string> {
//     const timestamp = Math.floor(Date.now() / 1000).toString();
//     const nonce = Math.floor(100000 + Math.random() * 900000).toString();
//     const sign = this.generateHmacSignature(timestamp, nonce);
    
//     return {
//       'Content-Type': 'application/json',
//       'accessKey': this.accessKey,
//       'timestamp': timestamp,
//       'nonce': nonce,
//       'sign': sign
//     };
//   }

//   /**
//    * Create a payment order
//    */
//   public async createPaymentOrder(params: {
//     orderNo: string;
//     amount: string;
//     currency: string;
//     channelCode: string;
//     accountName?: string;
//     bankName?: string;
//     bankAccount?: string;
//     ifsc?: string;
//     notifyUrl: string;
//   }): Promise<ServiceResponse> {
//     try {
//       const requestData: BSDPaymentPaymentCreateRequest = {
//         McorderNo: params.orderNo,
//         Amount: params.amount,
//         Type: params.currency.toLowerCase(),
//         ChannelCode: params.channelCode,
//         NotifyUrl: params.notifyUrl
//       };

//       // Add optional parameters for bank transfer if provided
//       if (params.accountName) requestData.name = params.accountName;
//       if (params.bankName) requestData.BankName = params.bankName;
//       if (params.bankAccount) requestData.BankAccount = params.bankAccount;
//       if (params.ifsc) requestData.Ifsc = params.ifsc;

//       this.logger.info(`BSDPayment API request: ${JSON.stringify(requestData)}`);
      
//       const response = await axios.post<BSDPaymentResponse>(
//         `${this.apiUrl}/payment/create`,
//         requestData,
//         {
//           headers: this.getAuthHeaders()
//         }
//       );

//       this.logger.info(`BSDPayment API response: ${JSON.stringify(response.data)}`);

//       if (response.data.code === 200) {
//         return {
//           success: true,
//           message: "Payment order created successfully",
//           data: response.data.data,
//         };
//       } else {
//         return {
//           success: false,
//           message: response.data.message || "Failed to create payment order",
//           data: response.data,
//         };
//       }
//     } catch (error: any) {
//       this.logger.error("Error creating BSDPayment payment order:", error.response?.data || error.message);
//       return {
//         success: false,
//         message: error.message || "Failed to create payment order",
//         data: error.response?.data,
//       };
//     }
//   }

//   /**
//    * Query payment order status
//    */
//   public async queryOrderStatus(orderNo: string, payerId: string): Promise<ServiceResponse> {
//     try {
//       const requestData: BSDPaymentOrderQueryRequest = {
//         OrderNo: orderNo,
//         PayerId: payerId
//       };

//       const response = await axios.post<BSDPaymentOrderQueryResponse>(
//         `${this.apiUrl}/order/query`,
//         requestData
//       );

//       if (response.data.code === 200) {
//         return {
//           success: true,
//           message: "Order query successful",
//           data: response.data.data,
//         };
//       } else {
//         return {
//           success: false,
//           message: response.data.message || "Failed to query order",
//           data: response.data,
//         };
//       }
//     } catch (error: any) {
//       this.logger.error("Error querying BSDPayment order:", error.response?.data || error.message);
//       return {
//         success: false,
//         message: error.message || "Failed to query order",
//         data: error.response?.data,
//       };
//     }
//   }

//   /**
//    * Query order details
//    */
//   public async queryOrderDetails(orderNo: string, payerId: string): Promise<ServiceResponse> {
//     try {
//       const requestData: BSDPaymentOrderDetailRequest = {
//         OrderNo: orderNo,
//         PayerId: payerId
//       };

//       const response = await axios.post<BSDPaymentResponse>(
//         `${this.apiUrl}/order/QueryDetail`,
//         requestData
//       );

//       if (response.data.code === 200) {
//         return {
//           success: true,
//           message: "Order details query successful",
//           data: response.data.data,
//         };
//       } else {
//         return {
//           success: false,
//           message: response.data.message || "Failed to query order details",
//           data: response.data,
//         };
//       }
//     } catch (error: any) {
//       this.logger.error("Error querying BSDPayment order details:", error.response?.data || error.message);
//       return {
//         success: false,
//         message: error.message || "Failed to query order details",
//         data: error.response?.data,
//       };
//     }
//   }

//   /**
//    * Query UPI status
//    */
//   public async queryUpi(upi: string): Promise<ServiceResponse> {
//     try {
//       const requestData: BSDPaymentQueryUpiRequest = {
//         upi: upi
//       };

//       const response = await axios.post<BSDPaymentResponse>(
//         `${this.apiUrl}/order/queryupi`,
//         requestData,
//         {
//           headers: this.getAuthHeaders()
//         }
//       );

//       if (response.data.code === 200) {
//         return {
//           success: true,
//           message: "UPI query successful",
//           data: response.data.data,
//         };
//       } else {
//         return {
//           success: false,
//           message: response.data.message || "Failed to query UPI",
//           data: response.data,
//         };
//       }
//     } catch (error: any) {
//       this.logger.error("Error querying BSDPayment UPI:", error.response?.data || error.message);
//       return {
//         success: false,
//         message: error.message || "Failed to query UPI",
//         data: error.response?.data,
//       };
//     }
//   }

//   /**
//    * Submit payment proof (UTR)
//    */
//   public async submitPaymentProof(orderNo: string, proof: string, payerId: string): Promise<ServiceResponse> {
//     try {
//       const requestData: BSDPaymentSubmitProofRequest = {
//         orderNo: orderNo,
//         proof: proof,
//         PayerId: payerId
//       };

//       const response = await axios.post<BSDPaymentResponse>(
//         `${this.apiUrl}/order/submitproof`,
//         requestData
//       );

//       if (response.data.code === 200) {
//         return {
//           success: true,
//           message: "Payment proof submitted successfully",
//           data: response.data.data,
//         };
//       } else {
//         return {
//           success: false,
//           message: response.data.message || "Failed to submit payment proof",
//           data: response.data,
//         };
//       }
//     } catch (error: any) {
//       this.logger.error("Error submitting BSDPayment payment proof:", error.response?.data || error.message);
//       return {
//         success: false,
//         message: error.message || "Failed to submit payment proof",
//         data: error.response?.data,
//       };
//     }
//   }

//   /**
//    * Generate a unique reference number for orders
//    */
//   public generateReferenceNumber(userId: string): string {
//     // Format: M2-{userId}-{timestamp}-{random}
//     const timestamp = Date.now();
//     const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//     return `M2-${userId.substring(0, 8)}-${timestamp}-${random}`;
//   }

//   /**
//    * Validate payment notification from BSDPayment
//    */
//   public validateNotification(notification: BSDPaymentPaymentNotification): ServiceResponse {
//     // Implement validation logic here if needed
//     // This could include signature verification, IP whitelisting, etc.
    
//     return {
//       success: true,
//       message: "Notification validated successfully",
//       data: notification,
//     };
//   }
// }