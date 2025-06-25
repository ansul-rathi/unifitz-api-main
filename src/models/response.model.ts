import { Status } from '@enums/status.enum';
import { IResponseBody, IResponse } from '@interfaces/response.interface';
import HttpStatusCodes from "http-status-codes"

const STATUS_MESSAGES = {
  [HttpStatusCodes.OK]: Status.SUCCESS,
  [HttpStatusCodes.BAD_REQUEST]: Status.BAD_REQUEST,
  [HttpStatusCodes.INTERNAL_SERVER_ERROR]: Status.ERROR
};

/**
 * class ResponseModel
 */
export default class ResponseModel {
  private body: IResponseBody;
  private code: number;

  /**
   * ResponseModel Constructor
   * @param data
   * @param code
   * @param message
   */
  constructor(data = {}, code = 402, message = '') {
    this.body = {
      data: data,
      message: message,
      status: STATUS_MESSAGES[code]
    };
    this.code = code;
  }

  /**
   * Add or update a body variable
   * @param variable
   * @param value
   */
  setBodyVariable = (variable: string, value: string): void => {
    this.body[variable] = value;
  };

  /**
   * Set Data
   * @param data
   */
  setData = (data: any): void => {
    this.body.data = data;
  };

  /**
   * Set Status Code
   * @param code
   */
  setCode = (code: number): void => {
    this.code = code;
  };

  /**
   * Get Status Code
   * @return {*}
   */
  getCode = (): number => {
    return this.code;
  };

  /**
   * Set message
   * @param message
   */
  setMessage = (message: string): void => {
    this.body.message = message;
  };

  /**
   * Get Message
   * @return {string|*}
   */
  getMessage = (): any => {
    return this.body.message;
  };

  /**
   * Geneate a response
   * @return {IResponse}
   */
  generate = (): IResponse => {
    return {
      statusCode: this.code,
      ...this.body
    };
  };
}
