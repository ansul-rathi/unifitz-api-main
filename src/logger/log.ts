/* eslint-disable @typescript-eslint/no-var-requires */
import Container from 'typedi';
import winston from 'winston';
// import { mongoUri } from "../loaders/mongoose";
// require("winston-mongodb");
const transports = [];
// workaround to solve ts error
// transportsUntyped: any = winston.transports;
if (process.env.NODE_ENV !== 'development') {
  transports.push(new winston.transports.Console());
  // transports.push(
  //   new transportsUntyped.MongoDB({
  //     db: mongoUri,
  //     label:"equipment",
  //     options:{
  //       useNewUrlParser: true,
  //       useUnifiedTopology: true
  //     }
  //   })
  // );
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.cli(), winston.format.splat())
    })
  );
}

// eslint-disable-next-line one-var
export const LoggerInstance = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  level: process.env.LOG_LEVEL || 'error',
  levels: winston.config.npm.levels,
  transports
});

Container.set('logger', LoggerInstance);
