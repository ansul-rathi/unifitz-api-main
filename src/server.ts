import 'reflect-metadata';
import helmet from 'helmet';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import cookieParser from 'cookie-parser';
import { Express, Request, Response } from 'express';
// import bodyParser from 'body-parser';
import cors from "cors"
import { Logger } from 'winston';
import express from './loaders/express';
import { LoggerInstance } from "./logger/log";
import { IndexRoute } from './routes/index.routes';
import errorHandler from '@middlewares/errorHandler';

require('./loaders/mongoose');
require("./logger/log")

import compression from 'compression';
import { PollingService } from '@services/polling.service';
import Container from 'typedi';
import { POLLING } from '@config/constants';
import { getPublicIp } from './utils';
import { CronService } from '@services/cron.service';

class App {
  private readonly app: Express;
  private logger: Logger = LoggerInstance;
  private indexRoute: IndexRoute;
  private pollingService: PollingService = Container.get(PollingService);
  private cronService: CronService = Container.get(CronService);


  // @ts-ignore
  private server: any;

  constructor() {
    this.app = express;
    this.indexRoute = new IndexRoute();
    this.routes();
    this.listen();
    this.handleShutdown();
    this.startPolling();
    this.cronService.scheduleJobs();
  }

  public getApp(): Express {
    return this.app;
  }
  


  private listen(): void {
    this.server = this.app.listen(process.env.PORT || 3005, () => {
      this.logger.info(`App Started on ${process.env.PORT}`);
    });
    getPublicIp();

    // eslint-disable-next-line no-console
    console.log('Server running on port : ', process.env.PORT);
  }

  private routes(): void {
    const initUrl = '/api/v1';

    // this.app.use(express.json());
    // this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser())
    this.app.use(cors());
    this.app.use(helmet());
    // this.app.set('trust proxy', true);


    this.app.use(
      compression({
        // fitler function to decide whether to compress response
        filter: (req: Request, res: Response) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
        level: 7
      })
    );
    // this.app.use(
    //   rateLimit({
    //     windowMs: 1000, // 1 second window
    //     max: 100 // limit each IP to 60 requests per windowMs
    //   })
    // );
    // if (process.env.NODE_ENV === 'local') {
    //   initUrl = '/user/api';
    // }
    this.app.get(`${initUrl}/test`, (_req: Request, res: Response) => {
      res.send({
        message: 'Welcome to Unifitz Server'
      });
    });
    this.app.use(initUrl, this.indexRoute.getApi());
    this.app.use(errorHandler);
  }
  private startPolling(): void {
    if (process.env.NODE_ENV !== 'test' && POLLING) {
      this.pollingService.startPolling();
    }
  }

  private handleShutdown(): void {
    const shutdown = () => {
      if (this.server) {
        this.pollingService.stopPolling();
        this.server.close(() => {
          this.logger.info('Server closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

export default new App().getApp();
