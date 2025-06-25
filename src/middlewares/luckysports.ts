import { Response, Request, NextFunction } from "express";
import HttpStatusCodes from "http-status-codes";
// import jwt from "jsonwebtoken";
import _ from "lodash";

import { LUCKY_SPORTS_JWT } from "@config/constants";

function luckySportsAuthMiddleware() {
  return async (
    req: Request | any,
    res: Response,
    next: NextFunction
  ): Promise<void | any> => {
    const token = await req.body["token"];

    if (!token) {
      return res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json({ 
          code: HttpStatusCodes.UNAUTHORIZED,
          message: "No token, authorization denied" });
    }

    try {
      if (LUCKY_SPORTS_JWT !== token) {
        return res
          .status(HttpStatusCodes.UNAUTHORIZED)
          .json({
            code: HttpStatusCodes.UNAUTHORIZED,
            message: "Invalid token, authorization denied" });
      }

      next();
    } catch (err) {
      res.status(HttpStatusCodes.UNAUTHORIZED).json({
        code: HttpStatusCodes.UNAUTHORIZED,
        message: "Token is not valid",
      });
    }
  };
}

export default luckySportsAuthMiddleware;
