import { StaffRole } from "@enums/user-role.enum";
import { Model } from "mongoose";

// Interface for the document
export interface IStaff extends Document {
    name: string;
    email: string;
    phoneNumber?: string;
    role: StaffRole;
    password: string;
    active: boolean;
    permissions: string[];
    lastLogin?: Date;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(enteredPassword: string): Promise<boolean>;
    getJWTToken(): string;
  }
  
  // Interface for the model
  export interface IStaffModel extends Model<IStaff> {
    getJWTToken(): string;
    comparePassword(enteredPassword: string): Promise<boolean>;
  }