import { Service } from "typedi";
// import { Logger } from "winston";
// import { Container } from "typedi";
import { ServiceResponse } from "@interfaces/service-response.interface";


@Service()
export class ExchangeService {
  // private logger: Logger = Container.get("logger");


  public async make(userId: string, amount: number, currency: string, type: string): Promise<ServiceResponse> {
    console.log({userId, amount, currency, type})
    return {
        success: true,
        message: "Exchange made successfully",
        data: null
    }
  }
}
