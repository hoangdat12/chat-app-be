import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { IFriend } from 'src/ultils/interface/friend.interface';

@Schema({ collection: 'Notify', timestamps: true })
export class Notify {
  @Prop()
  user_id: string;

  @Prop()
  notify_type: string;

  @Prop()
  notify_link: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  notify_friend: IFriend;

  @Prop()
  notify_content: string;

  @Prop()
  notify_image: string;

  @Prop({ default: false })
  notify_readed: boolean;
}
const NotifySchema = SchemaFactory.createForClass(Notify);

export const NotifyModel = {
  name: Notify.name,
  schema: NotifySchema,
};
