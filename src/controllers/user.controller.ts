import { Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import { UserService } from "@services/user.service";
import HttpStatusCodes from "http-status-codes";
import ResponseModel from "@models/response.model";
import { IRequest } from "@interfaces/express.interface";

@Service()
export class UserController {
  constructor(private userService: UserService) {}

  public async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        startDate,
        endDate,
        status,
        role
      } = req.query;
      let searchFields: string[] | undefined;

      if (req.query.searchFields) {
        if (typeof req.query.searchFields === 'string') {
          // Handle comma-separated string
          searchFields = req.query.searchFields.split(',').map(field => field.trim());
        } else if (Array.isArray(req.query.searchFields)) {
          // Handle array input
          searchFields = req.query.searchFields as string[];
        }
      }

      const result = await this.userService.listUsers({
        page: Number(page),
        limit: Number(limit),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder),
        search: search as string,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined,
        status: status as string,
        role: role as string,
        searchFields: searchFields,
      });
       

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await this.userService.getUserById(userId);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.NOT_FOUND).json(
          new ResponseModel(null, HttpStatusCodes.NOT_FOUND, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async getMyDetails(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.userService.getUserById(req.user.id);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.NOT_FOUND).json(
          new ResponseModel(null, HttpStatusCodes.NOT_FOUND, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await this.userService.updateUser(userId, req.body);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }
  public async exportCustomerData(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const result = await this.userService.exportCustomerData({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      if (result.success) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=customer-data.csv"
        );
        res.status(HttpStatusCodes.OK).send(result.data);
      } else {
        res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.BAD_REQUEST,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }

  public async updatePasswordByAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await this.userService.updatePasswordByAdmin(userId, req.body.password);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }

  public async updateMyDetails(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.userService.updateUser(req.user.id, req.body);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }
  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const result = await this.userService.deleteUser(userId);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(
          new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate()
        );
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(
          new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate()
        );
      }
    } catch (error) {
      next(error);
    }
  }
}