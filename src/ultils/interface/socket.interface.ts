import { IParticipant } from './conversation.interface';

export interface ISocketCallInitiate {
  caller: IParticipant;
  receiver: IParticipant;
  conversationId: string;
}
