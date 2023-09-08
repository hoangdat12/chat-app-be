import {
  IDataChangeUsernameOfParticipant,
  PayloadCreateConversation,
} from '../../conversation/conversation.dto';
import { ConversationRepository } from '../../conversation/conversation.repository';
import { MessageRepository } from '../../message/message.repository';
import { UserJoinChat } from '../../message/message.dto';
import { Messages } from '../../schema/message.model';
import { ObjectId } from 'mongoose';
import { IUserCreated } from './auth.interface';

export interface IConversation {
  _id: string;
  conversation_type: string;
  participants: IParticipant[];
  lastMessage: IMessage;
  nameGroup: string | undefined;
  updatedAt: string;
  createdAt: string;
  creators?: IParticipant[];
  userId: string[];
  avatarUrl: string;
  collection: string;
  emoji?: string;
}

export interface IParticipant extends UserJoinChat {
  isReadLastMessage?: boolean;
  receiveNotification?: boolean;
}

export interface IPayloadCreateConversation {
  conversation_type: string;
  participants: IParticipant[];
}

export interface IPayloadCreateGroup {
  conversation_type: string;
  participants: IParticipant[];
  lastMessage: string | null;
  lastMessageSendAt: Date | null;
  creators: UserJoinChat[] | null;
  name: string | null;
}

export interface IMessage extends Messages {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesDocument
  extends Document,
    Omit<Messages & { _id: ObjectId }, '_id'> {}

export interface ISocketDeleteMember {
  participant: IParticipant;
  conversation: IConversation;
}

export interface ISocketCreateConversation {
  conversation: IConversation;
  lastMessage: IMessage | null;
}

export interface ISocketAddMember extends ISocketCreateConversation {
  newMember: IParticipant[];
}

export interface ISocketLeaveMember {
  conversation: IConversation;
  user: IUserCreated;
}

export interface IGatewayDeleteMessage {
  _id: string;
  participants: IParticipant[];
  message_sender_by: IUserCreated;
}

export interface iSocketDeleteMessage {
  message: IMessage;
  lastMessage: IMessage;
}

export interface ISocketChangeUsername
  extends IDataChangeUsernameOfParticipant {
  participants: IParticipant[];
}

export interface ISocketChangeEmoji {
  user: IUserCreated;
  conversation: IConversation;
}

export interface IMessageCall {
  status?: string;
  time?: string;
  caller: IParticipant;
  receiver: IParticipant;
}
