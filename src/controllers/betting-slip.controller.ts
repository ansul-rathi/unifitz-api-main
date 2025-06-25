// import { Service, Container } from 'typedi';
// import { Response, NextFunction } from 'express';
// import { Logger } from 'winston';
// import { body, query } from 'express-validator';
// import HttpStatusCodes from 'http-status-codes';
// import ResponseModel from '@models/response.model';
// import { IRequest } from '@interfaces/express.interface';
// import { BettingSlipService } from '@services/betting-slip.service';

// @Service()
// export class BettingSlipController {
//   private logger: Logger = Container.get('logger');
//   private bettingSlipService: BettingSlipService = Container.get(BettingSlipService);

//   public async createSlip(req: IRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       this.logger.info('BettingSlipController - Creating new slip');
//       const result = await this.bettingSlipService.createSlip(req.user.id, req.body.currency);

//       if (result.success) {
//         res.status(HttpStatusCodes.CREATED).json(
//           new ResponseModel(
//             result.data,
//             HttpStatusCodes.CREATED,
//             'Betting slip created successfully'
//           ).generate()
//         );
//       } else {
//         res.status(HttpStatusCodes.BAD_REQUEST).json(
//           new ResponseModel(
//             null,
//             HttpStatusCodes.BAD_REQUEST,
//             result.message
//           ).generate()
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error creating betting slip:', error);
//       next(error);
//     }
//   }

//   public async addSelection(req: IRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { slipId } = req.params;
//       const result = await this.bettingSlipService.addSelection(
//         slipId,
//         req.user.id,
//         req.body
//       );

//       if (result.success) {
//         res.status(HttpStatusCodes.OK).json(
//           new ResponseModel(
//             result.data,
//             HttpStatusCodes.OK,
//             'Selection added successfully'
//           ).generate()
//         );
//       } else {
//         res.status(HttpStatusCodes.BAD_REQUEST).json(
//           new ResponseModel(
//             null,
//             HttpStatusCodes.BAD_REQUEST,
//             result.message
//           ).generate()
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error adding selection:', error);
//       next(error);
//     }
//   }

//   public async removeSelection(req: IRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { slipId, selectionId } = req.params;
//       const result = await this.bettingSlipService.removeSelection(
//         slipId,
//         req.user.id,
//         selectionId
//       );

//       if (result.success) {
//         res.status(HttpStatusCodes.OK).json(
//           new ResponseModel(
//             result.data,
//             HttpStatusCodes.OK,
//             'Selection removed successfully'
//           ).generate()
//         );
//       } else {
//         res.status(HttpStatusCodes.BAD_REQUEST).json(
//           new ResponseModel(
//             null,
//             HttpStatusCodes.BAD_REQUEST,
//             result.message
//           ).generate()
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error removing selection:', error);
//       next(error);
//     }
//   }

//   public async validateSlip(req: IRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { slipId } = req.params;
//       const result = await this.bettingSlipService.validateSlip(slipId, req.user.id);

//       if (result.success) {
//         res.status(HttpStatusCodes.OK).json(
//           new ResponseModel(
//             result.data,
//             HttpStatusCodes.OK,
//             'Slip validated successfully'
//           ).generate()
//         );
//       } else {
//         res.status(HttpStatusCodes.BAD_REQUEST).json(
//           new ResponseModel(
//             null,
//             HttpStatusCodes.BAD_REQUEST,
//             result.message
//           ).generate()
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error validating slip:', error);
//       next(error);
//     }
//   }

//   public async placeBet(req: IRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { slipId } = req.params;
//       const result = await this.bettingSlipService.placeBet(slipId, req.user.id);

//       if (result.success) {
//         res.status(HttpStatusCodes.OK).json(
//           new ResponseModel(
//             result.data,
//             HttpStatusCodes.OK,
//             'Bet placed successfully'
//           ).generate()
//         );
//       } else {
//         res.status(HttpStatusCodes.BAD_REQUEST).json(
//           new ResponseModel(
//             null,
//             HttpStatusCodes.BAD_REQUEST,
//             result.message
//           ).generate()
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error placing bet:', error);
//       next(error);
//     }
//   }

//   public async getSlip(req: IRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { slipId } = req.params;
//       const result = await this.bettingSlipService.getSlip(slipId, req.user.id);

//       if (result.success) {
//         res.status(HttpStatusCodes.OK).json(
//           new ResponseModel(
//             result.data,
//             HttpStatusCodes.OK,
//             'Slip retrieved successfully'
//           ).generate()
//         );
//       } else {
//         res.status(HttpStatusCodes.NOT_FOUND).json(
//           new ResponseModel(
//             null,
//             HttpStatusCodes.NOT_FOUND,
//             result.message
//           ).generate()
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error retrieving slip:', error);
//       next(error);
//     }
//   }
//   public async listSlips(req: IRequest, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const { status, page = 1, limit = 10, fromDate, toDate } = req.query;
      
//       const result = await this.bettingSlipService.listSlips(req.user.id, {
//         status: status as string,
//         page: Number(page),
//         limit: Number(limit),
//         fromDate: fromDate ? new Date(fromDate as string) : undefined,
//         toDate: toDate ? new Date(toDate as string) : undefined
//       });

//       if (result.success) {
//         res.status(HttpStatusCodes.OK).json(
//           new ResponseModel(
//             result.data,
//             HttpStatusCodes.OK,
//             'Betting slips retrieved successfully'
//           ).generate()
//         );
//       } else {
//         res.status(HttpStatusCodes.BAD_REQUEST).json(
//           new ResponseModel(
//             null,
//             HttpStatusCodes.BAD_REQUEST,
//             result.message
//           ).generate()
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error retrieving betting slips:', error);
//       next(error);
//     }
//   }

//   public validate(method: string): any {
//     switch (method) {
//       case 'listSlips': {
//         return [
//           query('status')
//             .optional()
//             .isIn(['PENDING', 'PLACED', 'SETTLED', 'VOID'])
//             .withMessage('Invalid status'),
//           query('page')
//             .optional()
//             .isInt({ min: 1 })
//             .withMessage('Page must be a positive integer'),
//           query('limit')
//             .optional()
//             .isInt({ min: 1, max: 100 })
//             .withMessage('Limit must be between 1 and 100'),
//           query('fromDate')
//             .optional()
//             .isISO8601()
//             .withMessage('Invalid from date'),
//           query('toDate')
//             .optional()
//             .isISO8601()
//             .withMessage('Invalid to date')
//         ];
//       }
//       case 'createSlip': {
//         return [
//           body('currency')
//             .exists()
//             .withMessage('Currency is required')
//             .isString()
//             .isLength({ min: 3, max: 3 })
//             .withMessage('Currency must be a 3-letter code')
//         ];
//       }
//       case 'addSelection': {
//         return [
//           body('eventId').exists().withMessage('Event ID is required'),
//           body('marketId').exists().withMessage('Market ID is required'),
//           body('outcomeId').exists().withMessage('Outcome ID is required'),
//           body('odds')
//             .exists()
//             .withMessage('Odds are required')
//             .isFloat({ min: 1.0 })
//             .withMessage('Odds must be at least 1.0'),
//           body('stake')
//             .exists()
//             .withMessage('Stake is required')
//             .isFloat({ min: 0.1 })
//             .withMessage('Minimum stake is 0.1')
//         ];
//       }
//       default:
//         return [];
//     }
//   }
// }