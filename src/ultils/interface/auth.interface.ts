import { User } from '../../schema/user.model';

export interface ILoginWithGoogleData {
  email: string;
  firstName: string | null;
  lastName: string;
  avatarUrl: string;
  loginWith: string;
}

export interface IUserDataCreate {
  email: string;
  firstName: string;
  lastName: string;
  password: string | undefined;
}

export interface IUserCreated extends User {
  _id: string;
}

export interface KeyTokenCreate {
  privateKey: any;
  publicKey: any;
  refreshToken: string;
  user: any;
}

export interface IOtpTokenCreate {
  email: string;
  token: string;
  secret: string;
}
