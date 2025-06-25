import { UserRole } from "@enums/user-role.enum";
import { IUser } from "@interfaces/user.interface";
import { Model, Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { jwtExpires, jwtSecret } from "@config/constants";
import { IQueryModel } from "@interfaces/query.interface";

const MODEL_NAME = "User";
const COLLECTION_NAME = "users";

const UsersSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    role: { type: String, default: UserRole.USER },
    phoneNumber: { type: String, 
      sparse: true,
       unique: true 
      },
    pendingPhoneNumber: { type: String, sparse: true },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    signupComplete: { type: Boolean, default: false },
    active: {type: Boolean, default: true},
    name: {
      type: String,
      required: [true, "Please enter a Name"],
    },
    password: {
      type: String,
      required: [true, "Please enter Password"],
      // minLength: [8, "Password should be at least 8 characters"],
      select: false,
    },
    luckySportUserId: {
      type: String,
      default: null,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet'
    },
    luckySportPlayerId: {
      type: String,
      default: null,
    },
    referralCode: {
      type: String,
      default: null,
    },
    reference: {
      type: String,
    },
    // partnerAccessRoles: [{
    //   type: String,
    //   enum: Object.values(WinPartnerAccess)
    // }],
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    fundist: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true, strict: false }
);

UsersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await hash(this.password, 10);
  next();
});

UsersSchema.set("toJSON", {
  transform(_doc: any, ret: any, _opt: any) {
    delete ret.password;
    return ret;
  },
});

UsersSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await compare(enteredPassword, this.password);
};

UsersSchema.statics.getAllUsers = async function (query: IQueryModel) {
  const {
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    page = 0,
  } = query;
  return await this.find()
    .skip(Number(page) * Number(limit))
    .limit(Number(limit))
    .sort({
      [sortBy]: sortOrder,
    });
};

UsersSchema.methods.getJWTToken = function () {
  return sign({ id: this._id, role: this.role }, jwtSecret, {
    expiresIn: jwtExpires,
  });
};

export interface IUserModel extends Model<IUser> {
  getAllUsers(query: IQueryModel): Promise<IUser[]>;
  getJWTToken(): string;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

export const UserModel: IUserModel = model<IUser, IUserModel>(
  MODEL_NAME,
  UsersSchema,
  COLLECTION_NAME
);
