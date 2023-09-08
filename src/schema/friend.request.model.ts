import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from './user.model';
import { IUserCreated } from '../ultils/interface';
import { FriendStatus } from '../ultils/constant';

@Schema({ collection: 'FriendRequest', timestamps: true })
export class FriendRequest {
  @Prop({ type: Types.ObjectId, ref: User.name })
  sender: IUserCreated;

  @Prop({ type: Types.ObjectId, ref: User.name })
  receiver: IUserCreated;

  @Prop({ enum: FriendStatus, default: FriendStatus.PENDING })
  status: string;
}
const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

export const FriendRequestModel = {
  name: FriendRequest.name,
  schema: FriendRequestSchema,
};
