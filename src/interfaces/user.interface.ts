
export interface IUserDto {
  name: string;
  email?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  pendingPhoneNumber?: string;
  password: string;
  role: string;
  signupComplete: boolean;
  emailVerified: boolean;
  country?: string;
  active?: boolean;
  wallet?: any;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  address?: string;
  luckySportPlayerId?: string;
  luckySportUserId?: string;
  partnerId?: string;
  referralCode?: string;
  reference: string;
  fundist?: boolean;
}


export interface IUser extends IUserDto {
  _id: string;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

export interface IloginUser {
  email: string;
  password: string;
}
export interface ICreateUser {
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
}
export interface IUserQueryModel {
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: string;
}

export interface IListUsersParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  search?: string;
  searchFields?: string[];
  startDate?: Date;
  endDate?: Date;
  status?: string;
  role?: string;
}