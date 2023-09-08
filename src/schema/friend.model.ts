import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from './user.model';
import { IUserCreated } from '../ultils/interface';

@Schema({ collection: 'Friend', timestamps: true })
export class Friend {
  @Prop({ type: Types.ObjectId, ref: User.name })
  friend_sender: IUserCreated;

  @Prop({ type: Types.ObjectId, ref: User.name })
  friend_receiver: IUserCreated;
}
const FriendSchema = SchemaFactory.createForClass(Friend);

export const FriendModel = {
  name: Friend.name,
  schema: FriendSchema,
};
