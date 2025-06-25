import ResponseModel from "@models/response.model";
import { SessionStorage } from "@services/session.service";
import { Response } from "express";
import Container from "typedi";

// import { cookieExpires } from "src/config/constants";

// creating token and saving in cookie
export const sendToken = (user: any, statusCode: any, res: Response) => {
  const token = user.getJWTToken();
  const sessionStorage = Container.get(SessionStorage);
  // option for cookie
  // const expiresDate = Date.now() + (cookieExpires as any) * 24 * 60 * 60 * 1000;
  // const options = {
  //   expires: new Date(expiresDate),
  //   httpOnly: true,
  // };
  sessionStorage.saveUserSession(user._id.toString(), token);
  const response = new ResponseModel(
    {user,
    token},
    statusCode,
    "User logged in successfully"
  );

  res
    .status(statusCode)
    // .cookie("token", token, options)
    .json(response.generate());
};