import { Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import HttpStatusCodes from "http-status-codes";

import HttpException from "../exceptions/httpException.exception";
import ResponseModel from "@models/response.model";

function errorMiddleware(
  error: HttpException,
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const logger: Logger = Container.get("logger");
  logger.error(error.toString());
  // res.;
  res.status(error.status || 500).json({
    error: {
      message: error?.message,
      status: error?.status || 500,
    },
  });
  return;
  // return res.send(error);
}
export function validationHandler() {
  return async (req: Request | any, res: Response, next: NextFunction): Promise<void> => {
    // to check the validation and throw the reponse error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response = new ResponseModel(
        errors.array(),
        HttpStatusCodes.BAD_REQUEST,
        "Error while validating request body"
      );
      const logger: Logger = Container.get("logger");

      logger.info("Into Controller: Failed validating Request: Declined");

      res.status(HttpStatusCodes.BAD_REQUEST).json(response.generate());
      return;
    }
    next();
  };
}

export default errorMiddleware;
