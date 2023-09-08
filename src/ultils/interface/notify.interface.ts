import { IFriend } from './friend.interface';

export interface IUserHandleNotify {
  userId: string;
}
export interface INotify {
  _id: string;
  user_id: string;
  notify_type: string;
  notify_link: string;
  notify_friend: IFriend;
  notify_content: string;
  notify_image: string;
  notify_readed: boolean;
}

export interface INotifyLink {
  parrentCommentId: string;
  commentId?: string;
  postId?: string;
}

export interface INotifyPost {
  userId: string;
  userName: string;
}

export interface IDataCreateNotify {
  user_id: string;
  notify_type: string;
  notify_link: string;
  notify_friend: IFriend | null;
  notify_content: string;
  notify_image: string;
}

export interface UserNotify {
  userId: string;
  userName: string;
  avatarUrl: string;
}

export interface ISocketReceivedNotify {
  notify: INotify;
}
