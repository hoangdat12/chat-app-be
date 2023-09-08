import { IsEmail, IsNotEmpty } from 'class-validator';
import { IMessageCall, IParticipant } from '../ultils/interface';

export class UserJoinChat {
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  avatarUrl: string;
  @IsNotEmpty()
  userName: string;
  enable?: boolean;
  peerId?: string;
}

export class PayloadCreateMessage {
  message_type: string;
  message_content: string;
  conversationId: string;
  message_received: UserJoinChat[];
  message_content_type?: string;
  message_call?: IMessageCall;
  createdAt?: Date;
  message_sender_by?: IParticipant;
}

export class CreateMessageData {
  message_type: string;

  message_content: string;

  @IsNotEmpty()
  conversationId: string;

  @IsNotEmpty()
  participants: IParticipant[];

  message_content_type?: string;

  message_call?: IMessageCall;

  createdAt?: Date;

  message_sender_by?: IParticipant;
}

export class CreateMessageCallData extends CreateMessageData {}

export class DelelteMessageData {
  message_type: string;

  @IsNotEmpty()
  conversationId: string;

  @IsNotEmpty()
  message_id: string;
}

export class UpdateMessageData extends CreateMessageData {
  @IsNotEmpty()
  message_id: string;
}
