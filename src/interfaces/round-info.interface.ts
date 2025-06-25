import { IFundistBaseRequest } from "./fundist.interface";

export interface IRoundAction {
    actid: string;
    type: 'bet' | 'win';
    amount: string;
    timestamp: string;
  }
  
  export interface IFundistRoundInfoRequest extends IFundistBaseRequest {
    type: 'roundinfo';
    gameid: string;
    userid: string;
    actions: IRoundAction[];
    i_gamedesc: string;
    hmac: string;
  }
  
  export interface IFundistRoundInfoResponse {
    status: 'OK';
    hmac: string;
  }