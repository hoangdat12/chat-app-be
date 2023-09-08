import { Post } from '../../schema/post.model';

export interface IUserLikePost {
  userId: string;
  avatarUrl: string;
  userName: string;
}

export interface IPost extends Post {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
