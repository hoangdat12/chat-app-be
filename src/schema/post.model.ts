import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PostMode, PostType } from '../ultils/constant';
import { IPost, IUserCreated, IUserLikePost } from '../ultils/interface';
import mongoose from 'mongoose';

@Schema({ collection: 'Post', timestamps: true })
export class Post {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: IUserCreated;

  @Prop()
  post_content: string;

  @Prop()
  post_image: string;

  @Prop({ default: [] })
  post_likes: IUserLikePost[];

  @Prop({ enum: PostType, default: PostType.POST })
  post_type: string;

  @Prop({ enum: PostMode, default: PostMode.PUBLIC })
  post_mode: string;

  @Prop({ default: 0 })
  post_comments_num: number;

  @Prop({ default: 0 })
  post_likes_num: number;

  @Prop({ default: 0 })
  post_share_num: number;

  @Prop({ default: [] })
  post_tag: IUserLikePost[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post' })
  post_share: IPost;
}

const PostSchema = SchemaFactory.createForClass(Post);
export const PostModel = {
  name: Post.name,
  schema: PostSchema,
};
