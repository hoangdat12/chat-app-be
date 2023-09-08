import { IUserCreated } from './auth.interface';

export interface IFriend {
  _id: string;
  email: string;
  userName: string;
  avatarUrl: string;
  firstName: string;
  lastName: string;
  isFriend?: boolean;
  peerId: string;
}

export interface ISocketAddFriend {
  user: IUserCreated;
  friend: IFriend;
}
