import { Service } from "typedi";
import { Container } from "typedi";
import { Logger } from "winston";
import { WalletService } from "./wallet.service";
import { UserModel } from "@models/user.model";
import crypto from "crypto";
import { ServiceResponse } from "@interfaces/service-response.interface";
import {
  IFundistBalanceRequest,
  IFundistBalanceResponse,
  IFundistDebitRequest,
  IFundistPingResponse,
} from "@interfaces/fundist.interface";
import {
  validateCreditRequest,
  validateDebitRequest,
} from "@middlewares/fundist";
import { fundistConfig } from "@config/constants";
import { TransactionModel } from "@models/transactions.model";
import { WalletModel } from "@models/wallet.model";
import { RoundInfoModel } from "@models/round-info.model";
import {
  IFundistRoundInfoRequest,
  IFundistRoundInfoResponse,
} from "@interfaces/round-info.interface";

@Service()
export class FundistOneWalletService {
  private logger: Logger = Container.get("logger");
  private walletService: WalletService = Container.get(WalletService);

  //   test
  // private secretKey: string =
  //   "iexoocaquaenogoob7xoosaingeofoh9ighoh4eevoshaiNaN2gahHieYaix7iem";

  //   production
  private secretKey: string = fundistConfig.hmacSecret;

  constructor() {
    if (!this.secretKey) {
      throw new Error("Secret key is required for HMAC authentication");
    }
  }

  /**
   * Generate a SHA256 HMAC of a given message object.
   * @param message - The object to generate the HMAC of.
   * @returns The HMAC of the message as a hexadecimal string.
   */
  private generateHMAC(message: any): string {
    const base = Object.assign({}, message);
    delete base.hmac;
    if ("actions" in base) {
      let actions = "";
      for (const action of base.actions) {
        Object.keys(action)
          .sort()
          .forEach((key) => (actions += action[key]));
      }
      base.actions = actions;
    }
    const hash = crypto.createHash("sha256");
    const hmac = crypto.createHmac(
      "sha256",
      hash.update(this.secretKey).digest()
    );
    let hmacBase = "";
    Object.keys(base)
      .sort()
      .forEach((key) => (hmacBase += base[key]));
    const hmacString = hmac.update(hmacBase).digest("hex");
    return hmacString;

    // const sortedKeys = Object.keys(message).sort();
    // let hmacBase = "";
    // sortedKeys.forEach((key) => {
    //   if (key !== "hmac") {
    //     hmacBase += Array.isArray(message[key])
    //       ? JSON.stringify(message[key])
    //       : message[key];
    //   }
    // });

    // const hash = crypto.createHash("sha256");
    // const hmac = crypto.createHmac(
    //   "sha256",
    //   hash.update(this.secretKey).digest()
    // );
    return hmac.update(hmacBase).digest("hex");
  }

  /**
   * Formats a response object with a HMAC.
   * @param success - A boolean indicating success or failure of the request.
   * @param data - An optional object containing data associated with the response.
   * @param message - An optional string containing an error message.
   * @returns The formatted response object with a HMAC.
   */
  public formatResponse(
    success: boolean,
    data: any = null,
    message: string = ""
  ): any {
    const response = success
      ? {
          status: "OK",
          ...data,
        }
      : {
          error: message,
          ...data
        };

    // Add HMAC to response
    response.hmac = this.generateHMAC(response);

    return response;
  }

  private async validateHMAC(message: any): Promise<boolean> {
    const receivedHMAC = message.hmac;
    delete message.hmac;
    const calculatedHMAC = this.generateHMAC(message);
    // console.log("calculatedHMAC", calculatedHMAC);
    // console.log("receivedHMAC", receivedHMAC);
    return receivedHMAC === calculatedHMAC;
  }

  public async handleRequest(request: any): Promise<any> {
    if (!(await this.validateHMAC(request))) {
      return this.formatResponse(false, null, "Invalid HMAC");
    }
    let validation;

    switch (request.type) {
      case "ping":
        return this.handlePing();
      case "balance":
        return this.handleBalance(request);
      case "debit":
        validation = validateDebitRequest(request);
        if (!validation.isValid) {
          return this.formatResponse(false, {
            error: validation.errors.join(", "),
          });
        }
        return this.handleDebit(request);
      case "credit":
        validation = validateCreditRequest(request);
        if (!validation.isValid) {
          return this.formatResponse(false, {
            error: validation.errors.join(", "),
          });
        }
        return this.handleCredit(request);
      case "roundinfo":
        return this.handleRoundInfo(request);

      default:
        return {
          success: false,
          message: "Unsupported request type",
          data: null,
        };
    }
  }

  private async handlePing(): Promise<IFundistPingResponse> {
    return this.formatResponse(true, { status: "OK" });
  }

  private async handleBalance(
    request: IFundistBalanceRequest
  ): Promise<IFundistBalanceResponse> {
    console.log("reached handleBalance");
    if (request.currency && request.currency !== "INR") {
      return this.formatResponse(false, null, "Invalid currency");
    }
    try {
      const user = await UserModel.findById(request.userid).populate("wallet");
      if (!user || !user.wallet) {
        throw new Error("Wallet not found");
      }

      const response = {
        status: "OK",
        balance: formatBalance(user.wallet.balance),
      };

      return this.formatResponse(true, response);
    } catch (error) {
      this.logger.error("Error in handleBalance:", error);
    }
  }

  private async handleDebit(
    request: IFundistDebitRequest
  ): Promise<ServiceResponse> {
    try {
      if (request.currency !== "INR") {
        return this.formatResponse(false, null, "Invalid currency");
      }
      const userWallet = await WalletModel.findOne({ userId: request.userid });
      if (!userWallet) {
        throw new Error("Wallet not found");
      }

      let txnExists: any = await TransactionModel.exists({
        reference: `tid:${request.tid}`,
      });
      if (txnExists) {
        const response = {
          status: "OK",
          tid: request.tid,
          balance: formatBalance(userWallet.balance),
        };
        return this.formatResponse(
          true,
          response,
          "Debit processed successfully"
        );
      }
      txnExists = await TransactionModel.findOne({
        "metadata.gameId": request.i_gameid,
        "metadata.actionId": request.i_actionid,
        status: "COMPLETED",
        ...(request.subtype && {"metadata.subtype": request.subtype}),
      });
      if (txnExists) {
        const storedData: any = {
          userid: txnExists.metadata.fundistId,
          currency: txnExists.currency,
          amount: formatBalance(txnExists.amount).toString(), // Convert back to cents
          type: txnExists.type.toLowerCase(),
          i_gameid: txnExists.metadata.gameId,
          i_actionid: txnExists.metadata.actionId,
          tid: txnExists.reference.replace("tid:", ""),
        };

        // Check for parameter mismatch (except type if it's a cancel)
        if (
          storedData.userid !== request.userid ||
          storedData.currency !== request.currency ||
          storedData.amount !== request.amount ||
          (request.subtype !== "cancel" && storedData.type !== request.type)
        ) {
          return this.formatResponse(
            false,
            {balance: formatBalance(userWallet.balance)},
            "Transaction parameter mismatch"
          );
        }
        const response = {
          status: "OK",
          tid: request.tid,
          balance: formatBalance(
            (await WalletModel.findOne({ userId: request.userid })).balance
          ),
        };
        return this.formatResponse(
          true,
          response,
          "Debit processed successfully"
        );
      }

      const amount = Math.abs(parseFloat(request.amount));

      if (userWallet.balance <= 0 || userWallet.balance < amount) {
        return this.formatResponse(
          false,
          { balance: formatBalance(userWallet.balance) },
          "INSUFFICIENT_FUNDS"
        );
      }

      const debitResult = await this.walletService.processTransaction({
        walletId: userWallet._id,
        amount,
        type: "DEBIT",
        category: "CASINO_BET",
        status: "COMPLETED",
        reference: `tid:${request.tid}`,
        metadata: {
          fundistId: request.userid,
          gameId: request.i_gameid,
          actionId: request.i_actionid,
          gameDesc: request.i_gamedesc,
          subtype: request.subtype,
          description: this.generateTransactionDescription({
            type: "DEBIT",
            subtype: request.subtype,
          }),
        },
      });

      if (!debitResult.success) {
        throw new Error(debitResult.message);
      }

      const response = {
        status: "OK",
        tid: request.tid,
        balance: formatBalance(debitResult.data.balance),
      };
      return this.formatResponse(
        true,
        response,
        "Debit processed successfully"
      );
    } catch (error) {
      this.logger.error("Error in handleDebit:", error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  private async handleCredit(request: any): Promise<ServiceResponse> {
    try {
      // Check currency
      if (request.currency !== "INR") {
        return this.formatResponse(false, null, "Invalid currency");
      }
      const userWallet = await WalletModel.findOne({ userId: request.userid });
      if (!userWallet) {
        throw new Error("Wallet not found");
      }
      let txnExists: any = await TransactionModel.findOne({
        reference: `tid:${request.tid}`,
      });
      if (txnExists) {
        // Validate essential fields
        if (
          txnExists.type !== "CREDIT" ||
          txnExists.currency !== request.currency ||
          txnExists.amount !== parseFloat(request.amount)
        ) {
          return this.formatResponse(
            false,
            null,
            "Transaction parameter mismatch"
          );
        }

        const response = {
          status: "OK",
          tid: request.tid,
          balance: formatBalance(userWallet.balance),
        };
        return this.formatResponse(
          true,
          response,
          "Credit processed successfully"
        );
      }
      // Check for existing transaction with same game ID and action ID
      txnExists =
        request.subtype !== "promotion" &&
        (await TransactionModel.findOne({
          "metadata.gameId": request.i_gameid,
          "metadata.actionId": request.i_actionid,
          "type": request.type.toUpperCase()
        }));
      if (txnExists) {
        const storedData: any = {
          userid: txnExists.metadata.fundistId,
          currency: txnExists.currency,
          amount: formatBalance(txnExists.amount).toString(),
          type: txnExists.type.toLowerCase(),
          i_gameid: txnExists.metadata.gameId,
          i_actionid: txnExists.metadata.actionId,
          tid: txnExists.reference.replace("tid:", ""),
        };

        // Check for parameter mismatch (except type if it's a cancel)
        if (
          storedData.userid !== request.userid ||
          storedData.currency !== request.currency ||
          storedData.amount !== request.amount ||
          (request.subtype !== "cancel" && storedData.type !== request.type)
        ) {
          return this.formatResponse(
            false,
            null,
            "Transaction parameter mismatch"
          );
        }

        const response = {
          status: "OK",
          tid: request.tid,
          balance: formatBalance(
            (await WalletModel.findOne({ userId: request.userid })).balance
          ),
        };
        return this.formatResponse(
          true,
          response,
          "Credit processed successfully"
        );
      }

      const amount = Math.abs(parseFloat(request.amount));

      const creditResult = await this.walletService.processTransaction({
        walletId: userWallet._id,
        amount,
        type: "CREDIT",
        category: "CASINO_WIN",
        status: "COMPLETED",
        reference: `tid:${request.tid}`,
        metadata: {
          gameId: request.i_gameid,
          actionId: request.i_actionid,
          gameDesc: request.i_gamedesc,
          fundistId: request.userid,
          description: this.generateTransactionDescription({
            type: "CREDIT",
            subtype: request.subtype,
            i_bonusdesc: request.i_bonusdesc,
            i_flag: request.i_flag,
            jackpot_win: request.jackpot_win,
          }),
          rollback: request.i_rollback,
          referenceActionId: request.i_reference_actionid,
          gameExtra: request.game_extra,
          jackpotWin: request.jackpot_win === 1,
          flag: request.i_flag,
          actionDetails: request.action_details,
          roundStart: request.round_start,
          roundEnded: request.round_ended,
          extParams: request.i_extparam,
          bonusId: request.i_bonusid,
          subtype: request.subtype,
          bonusDesc: request.i_bonusdesc,
        },
      });

      if (!creditResult.success) {
        throw new Error(creditResult.message);
      }

      const response = {
        status: "OK",
        tid: request.tid,
        balance: formatBalance(creditResult.data.balance),
      };

      return this.formatResponse(
        true,
        response,
        "Credit processed successfully"
      );
    } catch (error) {
      this.logger.error("Error in handleCredit:", error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
  private generateTransactionDescription(params: {
    type: "CREDIT" | "DEBIT";
    subtype?: string;
    i_bonusdesc?: string;
    i_flag?: string;
    jackpot_win?: number;
  }): string {
    if (params.type === "CREDIT") {
      if (params.subtype === "cancel") {
        return "Casino bet cancellation";
      }

      if (params.subtype === "promotion") {
        const bonusDesc = params.i_bonusdesc ? `: ${params.i_bonusdesc}` : "";
        return `Casino promotion credit${bonusDesc}`;
      }

      if (params.jackpot_win === 1) {
        return "Casino jackpot win";
      }

      if (params.i_flag) {
        return `Casino special win: ${params.i_flag}`;
      }

      return "Casino game win";
    }

    // For DEBIT type
    if (params.subtype === "cancel") {
      return "Casino win cancellation";
    }

    return "Casino bet placement";
  }

  private async handleRoundInfo(
    request: IFundistRoundInfoRequest
  ): Promise<IFundistRoundInfoResponse> {
    try {
      // Validate user exists
      const user = await UserModel.findById(request.userid);
      if (!user) {
        throw new Error("User not found");
      }

      // Parse actions timestamps
      const actions = request.actions.map((action) => ({
        ...action,
        timestamp: new Date(action.timestamp),
      }));

      // Create or update round info
      const roundInfo = await RoundInfoModel.findOneAndUpdate(
        {
          gameid: request.gameid,
          userid: request.userid,
        },
        {
          $setOnInsert: {
            i_gamedesc: request.i_gamedesc,
            actions,
            processed: false,
            retryCount: 0,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      // Mark as processed
      roundInfo.processed = true;
      roundInfo.lastRetryAt = new Date();
      await roundInfo.save();

      return this.formatResponse(
        true,
        { status: "OK" },
        "Round info processed successfully"
      );
    } catch (error) {
      this.logger.error("Error handling round info:", {
        error: error.message,
        request,
        stack: error.stack,
      });
      return this.formatResponse(false, null, error.message);
    }
  }
}

const formatBalance = (balance: number): string => {
  // make sure the balance is in 00.00 format
  return parseFloat(balance.toFixed(2)).toFixed(2);
};
