import {  Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { jwtExpires, jwtSecret } from "@config/constants";
import { StaffRole } from "@enums/user-role.enum";
import { IStaff, IStaffModel } from "@interfaces/staff.interface";

const MODEL_NAME = "Staff";
const COLLECTION_NAME = "staff";



const StaffSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a Name"],
      maxLength: [30, "Name cannot exceed 30 characters"],
      minLength: [4, "Name should be at least 4 characters"],
    },
    email: { 
      type: String, 
      required: true, 
    },
    phoneNumber: { 
      type: String, 
    },
    role: { 
      type: String,
      enum: Object.values(StaffRole),
      default: StaffRole.AGENT 
    },
    password: {
      type: String,
      required: [true, "Please enter Password"],
      minLength: [5, "Password should be at least 5 characters"],
      select: false,
    },
    active: {
      type: Boolean,
      default: true
    },
    // permissions: [{
    //   type: String,
    //   enum: ['VIEW_BETS', 'MANAGE_BETS', 'VIEW_USERS', 'MANAGE_USERS', 'VIEW_AGENTS', 'MANAGE_AGENTS']
    // }],
    lastLogin: Date,
    // department: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff'
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes
StaffSchema.index({ email: 1 }, { unique: true });
StaffSchema.index({ role: 1 });
// StaffSchema.index({ department: 1 });

// Password hashing middleware
StaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await hash(this.password, 10);
});

// Remove password from JSON
StaffSchema.set("toJSON", {
  transform(_doc: any, ret: any, _opt: any) {
    delete ret.password;
    return ret;
  },
});

// Methods
StaffSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await compare(enteredPassword, this.password);
};

StaffSchema.methods.getJWTToken = function () {
  return sign(
    { 
      id: this._id, 
      role: this.role,
      permissions: this.permissions 
    }, 
    jwtSecret, 
    {
      expiresIn: jwtExpires,
    }
  );
};



// Create and export the model
export const StaffModel: IStaffModel = model<IStaff, IStaffModel>(
  MODEL_NAME,
  StaffSchema,
  COLLECTION_NAME
);