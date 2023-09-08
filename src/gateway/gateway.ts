import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  IGatewaySessionManager,
} from './gateway.sesstion';
import { Services } from '../ultils/constant';
import { Messages } from '../schema/message.model';
import {
  ICallAccepPayload,
  ICallClosePayload,
  IMessage,
  INotify,
  IRejectVideoPayload,
  ISenderRejectPayload,
  ISocketAddMember,
  ISocketCallInitiate,
  ISocketChangeEmoji,
  ISocketChangeUsername,
  ISocketCreateConversation,
  ISocketDeleteMember,
  ISocketLeaveMember,
  ISocketReceivedNotify,
  iSocketDeleteMessage,
} from '../ultils/interface';
import { ISocketAddFriend } from '../ultils/interface/friend.interface';
import {
  SocketCall,
  WebsocketEvents,
} from '../ultils/constant/socket.constant';
import { ConversationRepository } from '../conversation/conversation.repository';
import { convertUserToIParticipant } from '../ultils';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
})
@Injectable()
export class MessagingGateway implements OnModuleInit {
  constructor(
    @Inject(Services.GATEWAY_SESSION_MANAGER)
    private readonly sessions: IGatewaySessionManager,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  onModuleInit() {
    this.server.on('connection', (socket: AuthenticatedSocket) => {
      this.sessions.setUserSocket(socket.user._id, socket);
      socket.emit('connection', { status: 'Good' });
    });
  }

  @WebSocketServer()
  private readonly server: Server;

  @SubscribeMessage('createMessage')
  onMessage(@MessageBody() body: any) {}

  @OnEvent('message.create')
  handleMessageCreateEvent(payload: Messages) {
    const { message_sender_by, message_received } = payload;
    for (let received of message_received) {
      if (received.userId === message_sender_by.userId) continue;
      const receivedSocket = this.sessions.getUserSocket(received.userId);
      if (receivedSocket) receivedSocket.emit('onMessage', payload);
    }
  }

  @OnEvent('message.update')
  handleMessageUpdateEvent(payload: IMessage) {
    const { message_sender_by, message_received } = payload;
    const senderSocket = this.sessions.getUserSocket(message_sender_by.userId);
    if (senderSocket) senderSocket.emit('onMessage', payload);
    for (let received of message_received) {
      if (received.userId === message_sender_by.userId) continue;
      const receivedSocket = this.sessions.getUserSocket(received.userId);
      if (receivedSocket) receivedSocket.emit('onMessageUpdate', payload);
    }
  }

  @OnEvent('message.delete')
  handleMessageDeleteEvent(payload: iSocketDeleteMessage) {
    const { message } = payload;
    const { message_received, message_sender_by } = message;
    for (let received of message_received) {
      if (received.userId === message_sender_by.userId) continue;
      const receivedSocket = this.sessions.getUserSocket(received.userId);
      if (receivedSocket) receivedSocket.emit('onMessageDelete', payload);
    }
  }

  @OnEvent('conversation.create')
  handleCreateGroup(payload: ISocketCreateConversation) {
    for (let participant of payload.conversation.participants) {
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket)
        participantSocket.emit('createConversation', payload);
    }
  }

  @OnEvent('conversaiton.participant.delete')
  handleDeleteMemberOfGroup(payload: ISocketDeleteMember) {
    for (let participant of payload.conversation.participants) {
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket)
        participantSocket.emit('onDeleteMemberOfGroup', payload);
    }
  }

  @OnEvent('conversaiton.participant.leave')
  handleUserLeaveGroup(payload: ISocketLeaveMember) {
    for (let participant of payload.conversation.participants) {
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket)
        participantSocket.emit('onUserLeaveGroup', payload);
    }
  }

  @OnEvent('conversaiton.participant.add')
  handleAddParticipant(payload: ISocketAddMember) {
    const { conversation, newMember, lastMessage } = payload;
    for (let participant of payload.conversation.participants) {
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket)
        participantSocket.emit('onAddMemberGroup', {
          conversationId: conversation._id,
          newMember,
          lastMessage,
        });
    }
  }

  @OnEvent('conversation.changeUsername')
  handleChangeUsername(payload: ISocketChangeUsername) {
    const { participants, ...data } = payload;
    for (let participant of participants) {
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket)
        participantSocket.emit('onChangeUsernameOfConversation', data);
    }
  }

  @OnEvent('conversation.changeEmoji')
  handleChangeEmoji(payload: ISocketChangeEmoji) {
    const { user, conversation } = payload;
    const { participants } = conversation;
    for (let participant of participants) {
      if (participant.userId === user._id) {
        continue;
      }
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket)
        participantSocket.emit('onChangeEmojiOfConversation', conversation);
    }
  }

  @OnEvent('conversation.changeAvatarGroup')
  handleChangeAvatarGroup(payload: ISocketChangeEmoji) {
    const { user, conversation } = payload;
    const { participants } = conversation;
    for (let participant of participants) {
      if (participant.userId === user._id) {
        continue;
      }
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket) {
        participantSocket.emit('onChangeAvatarOfGroup', conversation);
      }
    }
  }

  @OnEvent('conversation.changeNameGroup')
  handleChangeNameGroup(payload: ISocketChangeEmoji) {
    const { conversation } = payload;
    const { participants } = conversation;
    for (let participant of participants) {
      const participantSocket = this.sessions.getUserSocket(participant.userId);
      if (participantSocket) {
        participantSocket.emit('onChangeNameGroup', conversation);
      }
    }
  }

  @OnEvent('friend.confirm')
  handleConfirmFriend(payload: INotify) {
    const authSocket = this.sessions.getUserSocket(payload.user_id);
    if (authSocket) authSocket.emit('receivedNotify', payload);
  }

  @OnEvent('friend.received.add')
  handleSendConfirmToFriend(payload: ISocketAddFriend) {
    const { user, friend } = payload;
    const friendSocket = this.sessions.getUserSocket(friend._id);
    if (friendSocket) friendSocket.emit('onAddFriend', user);
  }

  @OnEvent('friend.user.cancel')
  handleUserCancelAddFriend(payload: ISocketAddFriend) {
    const { user, friend } = payload;
    const friendSocket = this.sessions.getUserSocket(friend._id);
    if (friendSocket) friendSocket.emit('onCancelFriend', user);
  }

  @OnEvent('notify.received')
  handleReceivedNotify(payload: ISocketReceivedNotify) {
    const { user_id } = payload.notify;
    const userSocket = this.sessions.getUserSocket(user_id);
    if (userSocket) userSocket.emit('receivedNotify', payload.notify);
  }

  @OnEvent('notify.delete')
  handleDeleteNotify(payload: ISocketReceivedNotify) {
    const { user_id } = payload.notify;
    const userSocket = this.sessions.getUserSocket(user_id);
    if (userSocket) userSocket.emit('deleteNotify', payload.notify);
  }

  @OnEvent('comment.create')
  handleCreateComment(payload: INotify) {
    const authSocket = this.sessions.getUserSocket(payload.user_id);
    if (authSocket) authSocket.emit('receivedNotify', payload);
  }

  @OnEvent('comment.like')
  handleLikeComment(payload: INotify) {
    const authSocket = this.sessions.getUserSocket(payload.user_id);
    if (authSocket) authSocket.emit('receivedNotify', payload);
  }

  // CALL
  @SubscribeMessage(SocketCall.ON_VIDEO_CALL_REQUEST)
  handleCallVideo(
    @MessageBody() data: ISocketCallInitiate,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const { receiver } = data;
    const receiverSocket = this.sessions.getUserSocket(receiver.userId);
    if (!receiverSocket) socket.emit('onUserUnavailable');
    receiverSocket.emit(WebsocketEvents.ON_VIDEO_CALL, data);
  }

  @SubscribeMessage(SocketCall.VIDEO_CALL_ACCEPTED)
  async handleVideoCallAccepted(
    @MessageBody() data: ICallAccepPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const callerSocket = this.sessions.getUserSocket(data.caller.userId);
    const conversation = await this.conversationRepository.findById(
      data.conversationId,
    );
    if (!conversation) return console.log('No conversation found');
    if (callerSocket) {
      const payload = {
        ...data,
        conversation,
        acceptor: convertUserToIParticipant(socket.user),
      };
      callerSocket.emit(WebsocketEvents.ON_VIDEO_CALL_ACCEPT, payload);
      socket.emit(WebsocketEvents.ON_VIDEO_CALL_ACCEPT, payload);
    }
  }

  @SubscribeMessage(SocketCall.VIDEO_CALL_REJECTED)
  async handleVideoCallRejected(
    @MessageBody() data: IRejectVideoPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const receiver = socket.user;
    const callerSocket = this.sessions.getUserSocket(data.caller.userId);
    callerSocket &&
      callerSocket.emit(WebsocketEvents.ON_VIDEO_CALL_REJECT, {
        receiver: convertUserToIParticipant(receiver),
        caller: data.caller,
      });
    socket.emit(WebsocketEvents.ON_VIDEO_CALL_REJECT, {
      receiver: convertUserToIParticipant(receiver),
      caller: data.caller,
    });
  }

  @SubscribeMessage(SocketCall.VIDEO_CALL_CLOSE)
  async handleCloseVideoCall(
    @MessageBody() data: ICallClosePayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const { caller, receiver } = data;
    if (socket.user._id === caller.userId) {
      const receiverSocket = this.sessions.getUserSocket(receiver.userId);
      socket.emit(WebsocketEvents.ON_VIDEO_CLOSE);
      return (
        receiverSocket && receiverSocket.emit(WebsocketEvents.ON_VIDEO_CLOSE)
      );
    }
    socket.emit(WebsocketEvents.ON_VIDEO_CLOSE);
    const callerSocket = this.sessions.getUserSocket(caller.userId);
    callerSocket && callerSocket.emit(WebsocketEvents.ON_VIDEO_CLOSE);
  }

  // Audio Call
  @SubscribeMessage(SocketCall.ON_AUDIO_CALL_REQUEST)
  async handleCallAudio(
    @MessageBody() data: ISocketCallInitiate,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const { receiver } = data;
    const receiverSocket = this.sessions.getUserSocket(receiver.userId);
    if (!receiverSocket) {
      socket.emit('onUserUnavailable');
      return;
    }
    receiverSocket.emit(WebsocketEvents.ON_VOICE_CALL, data);
  }

  @SubscribeMessage(SocketCall.VOICE_CALL_ACCEPTED)
  async handleVoiceCallAccepted(
    @MessageBody() payload: ICallAccepPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    console.log('Inside onVoiceCallAccepted event');
    const callerSocket = this.sessions.getUserSocket(payload.caller.userId);
    const conversation = await this.conversationRepository.findById(
      payload.conversationId,
    );
    if (!conversation) return console.log('No conversation found');
    if (callerSocket) {
      console.log('Emitting onVoiceCallAccepted event');
      const callPayload = {
        ...payload,
        conversation,
        acceptor: convertUserToIParticipant(socket.user),
      };
      callerSocket.emit(WebsocketEvents.ON_VOICE_CALL_ACCEPT, callPayload);
      socket.emit(WebsocketEvents.ON_VOICE_CALL_ACCEPT, callPayload);
    }
  }

  @SubscribeMessage(SocketCall.VOICE_CALL_REJECTED)
  async handleVoiceCallRejected(
    @MessageBody() data: IRejectVideoPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const receiver = socket.user;
    const callerSocket = this.sessions.getUserSocket(data.caller.userId);
    callerSocket &&
      callerSocket.emit(WebsocketEvents.ON_VOICE_CALL_REJECT, {
        receiver: convertUserToIParticipant(receiver),
        caller: data.caller,
      });
    socket.emit(WebsocketEvents.ON_VOICE_CALL_REJECT, {
      receiver: convertUserToIParticipant(receiver),
      caller: data.caller,
    });
  }

  @SubscribeMessage(SocketCall.VOICE_CALL_CLOSE)
  async handleVoiceCallHangUp(
    @MessageBody() { caller, receiver }: ICallClosePayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    console.log('inside onVoiceCallHangUp event');
    if (socket.user._id === caller.userId) {
      const receiverSocket = this.sessions.getUserSocket(receiver.userId);
      socket.emit(WebsocketEvents.ON_VOICE_CLOSE);
      return (
        receiverSocket && receiverSocket.emit(WebsocketEvents.ON_VOICE_CLOSE)
      );
    }
    socket.emit(WebsocketEvents.ON_VOICE_CLOSE);
    const callerSocket = this.sessions.getUserSocket(caller.userId);
    callerSocket && callerSocket.emit(WebsocketEvents.ON_VOICE_CLOSE);
  }

  @SubscribeMessage(SocketCall.SENDER_REJECT_CALL)
  async handleRejectCallOnSender(
    @MessageBody() data: ISenderRejectPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const receiver = data.receiver;
    const receiverSocker = this.sessions.getUserSocket(receiver.userId);
    if (receiverSocker)
      receiverSocker.emit(WebsocketEvents.ON_SENDER_REJECT_CALL);
  }
}
