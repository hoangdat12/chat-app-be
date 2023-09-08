import { IsNotEmpty } from 'class-validator';
import { UserJoinChat } from '../message/message.dto';
import { IParticipant } from '../ultils/interface';

export class IInforUserChangeNickname {
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  userName: string;
}

export class PayloadCreateConversation {
  @IsNotEmpty()
  conversation_type: string;

  @IsNotEmpty()
  participants: IParticipant[];
  creators: UserJoinChat[] | null;
  nameGroup?: string | null;
  avatarUrl?: string;
}

export class GetDeleteMessageOfConversation {
  @IsNotEmpty()
  conversationId: string;
}

export class PayloadDeletePaticipant {
  @IsNotEmpty()
  conversationId: string;

  @IsNotEmpty()
  participant: IParticipant;
}

export class PayloadAddPaticipant {
  @IsNotEmpty()
  conversation_type: string;

  @IsNotEmpty()
  conversationId: string;

  @IsNotEmpty()
  newParticipants: IParticipant[];
}

export class ChangeTopic {
  @IsNotEmpty()
  topic: string;

  @IsNotEmpty()
  conversationId: string;
}

export class IDataChangeUsernameOfParticipant {
  @IsNotEmpty()
  newUsernameOfParticipant: IParticipant;

  @IsNotEmpty()
  conversationId: string;
}

export class RenameGroup {
  @IsNotEmpty()
  nameGroup: string;

  @IsNotEmpty()
  conversationId: string;
}

export class ReadLastMessage {
  @IsNotEmpty()
  conversationId: string;
}

export class ChangeEmoji {
  @IsNotEmpty()
  conversationId: string;

  @IsNotEmpty()
  emoji: string;
}
