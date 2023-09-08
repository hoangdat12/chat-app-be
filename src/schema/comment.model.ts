import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from './post.model';
import { User } from './user.model';
import { CommentType } from '../ultils/constant';
import { IPost, IUserCreated, IUserLikePost } from '../ultils/interface';
import mongoose from 'mongoose';

@Schema({ collection: 'Comments', timestamps: true })
export class Comment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Post.name })
  comment_post_id: IPost;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  comment_user_id: IUserCreated;

  @Prop({ default: CommentType.TEXT, enum: CommentType })
  comment_type: string;

  @Prop({ required: true })
  comment_content: string;

  @Prop({ default: 0 })
  comment_left: number;

  @Prop({ default: 0 })
  comment_right: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Comment.name,
    default: null,
  })
  comment_parent_id: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  comment_likes_num: number;

  @Prop({ default: [] })
  comment_likes: IUserLikePost[];
}

const CommentSchema = SchemaFactory.createForClass(Comment);
export const CommentModel = {
  name: Comment.name,
  schema: CommentSchema,
};
