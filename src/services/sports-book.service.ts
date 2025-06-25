import { Service } from "typedi";
// import { Logger } from "winston";
// import { Container } from "typedi";
import { ServiceResponse } from "@interfaces/service-response.interface";


@Service()
export class SportsBookService {
  // private logger: Logger = Container.get("logger");

  /**
   * Initiates an exchange operation for a user.
   * 
   * @param userId - The identifier of the user making the exchange.
   * @param amount - The amount involved in the exchange.
   * @param currency - The currency type for the exchange.
   * @param type - The type of the exchange operation.
   * @returns A promise that resolves to a ServiceResponse indicating the success or failure of the operation.
   */
  public async make(userId: string, amount: number, currency: string, type: string): Promise<ServiceResponse> {
    console.log({userId, amount, currency, type})
    return {
        success: true,
        message: "Exchange made successfully",
        data: null
    }
  }
}
