import { Comment } from '../../schema/comment.model';

export interface IComment extends Comment {
  _id: string;
}

export interface ISocketCreateComment {}
