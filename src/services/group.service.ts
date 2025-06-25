import { Service } from "typedi";
import { GroupModel } from "@models/group.model";
import { ServiceResponse } from "@interfaces/service-response.interface";

@Service()
export class GroupService {
  public async createGroup(name: string,agents: string[], tags: string[], createdBy: string): Promise<ServiceResponse> {
    try {

      const existingGroup = await GroupModel.findOne({ name });
      if (existingGroup) {
        return {
          success: false,
          message: 'Group with this name already exists',
          data: null
        };
      }

      const group = await GroupModel.create({ name, agents, tags, createdBy });
      return {
        success: true,
        message: 'Group created successfully',
        data: group
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create group',
        data: null
      };
    }
  }
  public async updateGroup(groupId: string, name: string, tags: string[], agents: string[]): Promise<ServiceResponse> {
    try {
      const group = await GroupModel.findById(groupId);
      if (!group) {
        return {
          success: false,
          message: 'Group not found',
          data: null
        };
      }
      group.name = name;
      group.tags = tags;
      group.agents = agents;
      
      await group.save();
      return {
        success: true,
        message: 'Group updated successfully',
        data: group
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update group',
        data: null
      };
    }
  }

  public async listGroups(query: any): Promise<ServiceResponse> {
    try {
      const groups = await GroupModel.find(query).populate('agents');
      return {
        success: true,
        message: 'Groups retrieved successfully',
        data: groups
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve groups',
        data: null
      };
    }
  }
  public async listMyGroups(userId: string, query: any = {}): Promise<ServiceResponse> {
    try {
      // Find groups where the user is in the agents array
      const groups = await GroupModel.find({
        agents: userId,
        ...query
      }).populate('agents');
  
      return {
        success: true,
        message: 'Groups retrieved successfully',
        data: groups
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve groups',
        data: null
      };
    }
  }
  public async getGroupDetails(id:string): Promise<ServiceResponse> {
    try {
      const group = await GroupModel.findById(id).populate('agents');
      return {
        success: true,
        message: 'Group retrieved successfully',
        data: group
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve group',
        data: null
      };
    }
  }

  public async addAgentToGroup(groupId: string, agentId: string): Promise<ServiceResponse> {
    try {
      const group = await GroupModel.findById(groupId);
      if (!group) {
        return {
          success: false,
          message: 'Group not found',
          data: null
        };
      }
      group.agents.push(agentId);
      await group.save();
      return {
        success: true,
        message: 'Agent added to group successfully',
        data: group
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to add agent to group',
        data: null
      };
    }
  }
  public async removeAgentFromGroup(groupId: string, agentId: string): Promise<ServiceResponse> {
    try {
      const group = await GroupModel.findById(groupId);
      if (!group) {
        return {
          success: false,
          message: 'Group not found',
          data: null
        };
      }
      group.agents = group.agents.filter(agent => agent.toString() !== agentId);
      await group.save();
      return {
        success: true,
        message: 'Agent removed from group successfully',
        data: group
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to remove agent from group',
        data: null
      };
    }
  }

  /**
   * Retrieve a group by name.
   * @param {string} name Group name to search for.
   * @returns {Promise<ServiceResponse>} A promise resolving to a ServiceResponse object.
   *                                    If the group is found, the response's data will contain the group document.
   *                                    If the group is not found, the response's success will be false, and the message will be 'Group not found'.
   */
  public async getGroupByName(name: string): Promise<ServiceResponse> {
    try {
      const group = await GroupModel.findOne({ name })
        .populate('agents')
        .populate('createdBy', 'name email role'); // Also populate creator details

      if (!group) {
        return {
          success: false,
          message: 'Group not found',
          data: null
        };
      }

      return {
        success: true,
        message: 'Group retrieved successfully',
        data: group
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve group',
        data: null
      };
    }
  }
}