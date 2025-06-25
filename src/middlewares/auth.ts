import { Response, Request, NextFunction } from "express";
import HttpStatusCodes from "http-status-codes";
import jwt from "jsonwebtoken";
import _ from "lodash";

import { UserModel } from "@models/user.model";
import { StaffModel } from "@models/staff.model";
import { jwtSecret } from "@config/constants";
import Container from "typedi";
import { SessionStorage } from "@services/session.service";

function authorize(roles?: any[]) {
  const sessionStorage = Container.get(SessionStorage);

  return async (
    req: Request | any,
    res: Response,
    next: NextFunction
  ): Promise<void | any> => {
    const token = await req.headers["authorization"];

    if (!token) {
      return res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json({ 
          code: HttpStatusCodes.UNAUTHORIZED,
          message: "No token, authorization denied" });
    }

    try {
      const decodedData: any = jwt.verify(token, jwtSecret);
      if (!sessionStorage.isValidSession(decodedData.id, token)) {
        return res.status(HttpStatusCodes.UNAUTHORIZED).json({
          code: HttpStatusCodes.UNAUTHORIZED,
          message: "Session expired, please login again",
        });
      }
      let type = 'User'
      let user = await await UserModel.findOne({_id: decodedData.id, active: true})
      if (!user) {
        user = await StaffModel.findById(decodedData.id)
        type = "Staff"
      }

      if (!user) {
        return res.status(HttpStatusCodes.UNAUTHORIZED).json({
          code: HttpStatusCodes.UNAUTHORIZED,
          message: "User not found or has been deleted",
        });
      }

      // Check if user is active
      if (!user.active) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          code: HttpStatusCodes.FORBIDDEN,
          message: "Account has been deactivated",
        });
      }
      req.user = user;
      req.userType = type;

      if (!_.isEmpty(roles) && !_.includes(roles, decodedData.role)) {
        return res.status(HttpStatusCodes.UNAUTHORIZED).json({
          error: "You don't have enough permission to perform this action",
          code: HttpStatusCodes.UNAUTHORIZED
        });
      }
      next();
    } catch (err) {
      res.status(HttpStatusCodes.UNAUTHORIZED).json({
        message: "Token is not valid",
        code: HttpStatusCodes.UNAUTHORIZED

      });
    }
  };
}

export default authorize;
