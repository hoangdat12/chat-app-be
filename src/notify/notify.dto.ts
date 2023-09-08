import { IsNotEmpty } from 'class-validator';
import {
  INotifyLink,
  INotifyPost,
  IUserHandleNotify,
} from '../ultils/interface/notify.interface';
import { IFriend } from '../ultils/interface';

export class DataCreateNotify {
  @IsNotEmpty()
  notifyType: string;
  @IsNotEmpty()
  ownerNotify: IUserHandleNotify;
  notify_friend: IFriend;
  notifyLink: INotifyLink | null;
  post: INotifyPost | null;
}
