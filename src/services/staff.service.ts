import { Service, Container } from "typedi";
import { StaffModel } from "@models/staff.model";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { IStaff } from "@interfaces/staff.interface";
import { SessionStorage } from "./session.service";
import { hash } from "bcrypt";
import { StaffRole } from "@enums/user-role.enum";

@Service()
export class StaffService {
  private sessionStorage: SessionStorage = Container.get(SessionStorage);

  public async createStaff(
    staffData: Partial<IStaff>,
    createdBy: string
  ): Promise<ServiceResponse> {
    try {
      const existingStaff = await StaffModel.findOne({
        email: staffData.email,
      });

      if (existingStaff) {
        return {
          success: false,
          message: "Email already registered",
          data: null,
        };
      }

      const staff = await StaffModel.create({ ...staffData, createdBy });
      return {
        success: true,
        message: "Staff created successfully",
        data: staff,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create staff",
        data: error?.message ?? error,
      };
    }
  }

  public async updateStaff(
    staffData: Partial<IStaff>,
    staffId: string,
    createdBy: string
  ): Promise<ServiceResponse> {
    try {
      const existingStaff = await StaffModel.findById(staffId);
      if (!existingStaff) {
        return {
          success: false,
          message: "Staff not found",
          data: null,
        };
      }

      const existingStaffByEmail = await StaffModel.findOne({
        email: staffData.email,
        _id: { $ne: existingStaff._id },
      });

      if (existingStaffByEmail) {
        return {
          success: false,
          message: "Email already registered",
          data: null,
        };
      }

      const staff = await StaffModel.findByIdAndUpdate(
        staffId,
        { ...staffData, createdBy },
        { new: true }
      );
      return {
        success: true,
        message: "Staff updated successfully",
        data: staff,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create staff",
        data: error?.message ?? error,
      };
    }
  }

    public async updatePasswordByAdmin(
      userId: string,
      password: string
    ): Promise<ServiceResponse> {
      try {
        const hashPassword = await hash(password, 10);
        const user = await StaffModel.findByIdAndUpdate(
          userId,
          { $set: { password: hashPassword } },
          { new: true }
        ).select("-password -resetPasswordToken -resetPasswordExpire");
  
        if (!user) {
          return {
            success: false,
            message: "User not found",
            data: null,
          };
        }
  
        return {
          success: true,
          message: "Password updated successfully",
          data: user,
        };
      } catch (error) {
        return {
          success: false,
          message: "Failed to update password",
          data: null,
        };
      }
    }
  

  public async listStaff(): Promise<ServiceResponse> {
    try {
      const staff = await StaffModel.find({
        role: StaffRole.AGENT,
      });
      return {
        success: true,
        message: "Staff retrieved successfully",
        data: staff,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve staff",
        data: null,
      };
    }
  }

  public async login(
    email: string,
    password: string
  ): Promise<ServiceResponse> {
    try {
      const staff = await StaffModel.findOne({ email }).select("+password");
      if (!staff) {
        return {
          success: false,
          message: "Invalid email or password",
          data: null,
        };
      }

      const isPasswordValid = await staff.comparePassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid email or password",
          data: null,
        };
      }

      const token = staff.getJWTToken();
      this.sessionStorage.saveUserSession(staff._id.toString(), token);

      return {
        success: true,
        message: "Login successful",
        data: { staff, token },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to login",
        data: null,
      };
    }
  }

  public async getMe(staffId: string): Promise<ServiceResponse> {
    try {
      const staff = await StaffModel.findById(staffId);
      return {
        success: true,
        message: "Staff retrieved successfully",
        data: staff,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve staff",
        data: null,
      };
    }
  }
}
