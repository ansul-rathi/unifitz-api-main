import Container, { Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import { StaffService } from "@services/staff.service";
import HttpStatusCodes from "http-status-codes";
import { IRequest } from "@interfaces/express.interface";
import ResponseModel from "@models/response.model";
import { Logger } from "winston";
import { AuthService } from "@services/auth.service";
import { UserRole } from "@enums/user-role.enum";

@Service()
export class StaffController {
  private logger: Logger = Container.get("logger");
  private staffService: StaffService = Container.get(StaffService);
  private authService: AuthService = Container.get(AuthService);

  public async createStaff(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info('StaffController - Creating staff');

    try {
      const createdBy = req.user?.id || null;
      const result = await this.staffService.createStaff(req.body, createdBy);

      if (result.success) {
        res
          .status(HttpStatusCodes.CREATED)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.CREATED,
              result.message
            ).generate()
          );
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


  public async updateStaff(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.logger.info('StaffController - Creating staff');

    try {
      const createdBy = req.user?.id || null;
      const staffId = req.params.id;
      const result = await this.staffService.updateStaff(req.body, staffId, createdBy);

      if (result.success) {
        res
          .status(HttpStatusCodes.CREATED)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.CREATED,
              result.message
            ).generate()
          );
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
      const { staffId } = req.params;
      const result = await this.staffService.updatePasswordByAdmin(staffId, req.body.password);

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


  public async listStaff(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.staffService.listStaff();

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
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

  public async getMe(
    req: IRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userRole = req.user?.role;
      let result;
      if (userRole === UserRole.WIN_PARTNER) {
        result = await this.authService.validateToken(req.user?.id)
        const userData = result.data.user
        result.data = userData;
      }else{
        result = await this.staffService.getMe(req.user?.id);
      }
      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
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

  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.staffService.login(email, password);

      if (result.success) {
        res
          .status(HttpStatusCodes.OK)
          .json(
            new ResponseModel(
              result.data,
              HttpStatusCodes.OK,
              result.message
            ).generate()
          );
      } else {
        res
          .status(HttpStatusCodes.UNAUTHORIZED)
          .json(
            new ResponseModel(
              null,
              HttpStatusCodes.UNAUTHORIZED,
              result.message
            ).generate()
          );
      }
    } catch (error) {
      next(error);
    }
  }
}
