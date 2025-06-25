import { Container, Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "http-status-codes";
import ResponseModel from "@models/response.model";
import { SportsBookService } from "@services/sports-book.service";

@Service()
export class SportsBookController {
    private sportsBookService: SportsBookService = Container.get(SportsBookService);

    public async make(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, amount, currency, type } = req.body;
            const response = await this.sportsBookService.make(userId, amount, currency, type);
           
            
            res.status(HttpStatusCodes.OK).json(new ResponseModel(response.data, HttpStatusCodes.CREATED, response.message));
        } catch (error) {
            next(error);
        }
    }       
    
    
}
