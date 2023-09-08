import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IMessage, IParticipant } from '../ultils/interface';
import { UserJoinChat } from '../message/message.dto';
import { Types } from 'mongoose';
import { Messages } from './message.model';

@Schema({ collection: 'Conversation', timestamps: true })
export class Conversation {
  @Prop({ required: true })
  conversation_type: string;

  @Prop({ required: true })
  participants: IParticipant[];

  @Prop({ type: Types.ObjectId, ref: Messages.name })
  lastMessage: IMessage;

  @Prop({ default: 'default' })
  topic: string;

  @Prop({ default: '👍' })
  emoji?: string;

  @Prop()
  creators: UserJoinChat[] | null;

  @Prop()
  nameGroup: string | null;

  @Prop()
  avatarUrl: string | null;
}
const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({
  'participants.userId': 1,
  'participants.enable': 1,
});

export const ConversationModel = {
  name: Conversation.name,
  schema: ConversationSchema,
};
