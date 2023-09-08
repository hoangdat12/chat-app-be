import { IParticipant } from './conversation.interface';

export interface IRejectVideoPayload {
  caller: IParticipant;
}

export interface ICallAccepPayload extends IRejectVideoPayload {
  conversationId: string;
}

export interface ICallClosePayload extends IRejectVideoPayload {
  receiver: IParticipant;
}

export interface ISenderRejectPayload {
  receiver: IParticipant;
}
