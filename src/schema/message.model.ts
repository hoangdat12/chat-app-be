import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserJoinChat } from '../message/message.dto';
import { MessageContentType } from '../ultils/constant/message.constant';
import { IMessageCall } from 'src/ultils/interface';

@Schema({ collection: 'Messages', timestamps: true })
export class Messages {
  @Prop({ required: true, default: 'conversation' })
  message_type: string;

  @Prop({ default: MessageContentType.MESSAGE, enum: MessageContentType })
  message_content_type?: string;

  @Prop({ required: true })
  message_content: string;

  @Prop({ required: true })
  message_sender_by: UserJoinChat;

  @Prop({
    required: true,
  })
  message_conversation: string;

  @Prop({ required: true })
  message_received: UserJoinChat[];

  @Prop({ type: Object })
  message_call?: IMessageCall;
}

const MessagesSchema = SchemaFactory.createForClass(Messages);
// Index
MessagesSchema.index({ createdAt: 1 });
MessagesSchema.index({
  message_conversation: 1,
  'message_received.enable': 1,
  'message_received.userId': 1,
});

export const MessagesModel = {
  name: Messages.name,
  schema: MessagesSchema,
};
