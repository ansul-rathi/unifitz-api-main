import { Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import { GroupService } from "@services/group.service";
// import { ResponseModel } from "@models/response.model";
import HttpStatusCodes from "http-status-codes";
import ResponseModel from "@models/response.model";
import { IRequest } from "@interfaces/express.interface";

@Service()
export class GroupController {
  constructor(private groupService: GroupService) {}

  public async createGroup(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, tags, agents=[] } = req.body;
      const createdBy = req.user.id;
      const result = await this.groupService.createGroup(name, agents, tags, createdBy);

      if (result.success) {
        res.status(HttpStatusCodes.CREATED).json(new ResponseModel(result.data, HttpStatusCodes.CREATED, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }
  public async getGroupDetails(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.groupService.getGroupDetails(id);

      if (result.success) {
        res.status(HttpStatusCodes.CREATED).json(new ResponseModel(result.data, HttpStatusCodes.CREATED, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  public async listGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.groupService.listGroups(req.query);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }
  public async listMyGroups(req: IRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;
      const result = await this.groupService.listMyGroups(userId, req.query);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  public async updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId, agents, name, tags } = req.body;
      const result = await this.groupService.updateGroup(groupId, name, tags, agents);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  public async removeAgentFromGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId, agentId } = req.body;
      const result = await this.groupService.removeAgentFromGroup(groupId, agentId);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }

  public async addAgentToGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId, agentId } = req.body;
      const result = await this.groupService.addAgentToGroup(groupId, agentId);

      if (result.success) {
        res.status(HttpStatusCodes.OK).json(new ResponseModel(result.data, HttpStatusCodes.OK, result.message).generate());
      } else {
        res.status(HttpStatusCodes.BAD_REQUEST).json(new ResponseModel(null, HttpStatusCodes.BAD_REQUEST, result.message).generate());
      }
    } catch (error) {
      next(error);
    }
  }
}