import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConversationRepository } from '../conversation/conversation.repository';
import { MessageRepository } from './message.repository';
import { IUserCreated } from '../ultils/interface';
import {
  CreateMessageData,
  DelelteMessageData,
  PayloadCreateMessage,
  UpdateMessageData,
} from '../message/message.dto';
import { MessageType } from '../ultils/constant';
import { ConversationService } from '../conversation/conversation.service';
import { PayloadCreateConversation } from '../conversation/conversation.dto';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
  ) {}

  async createMessage(user: IUserCreated, data: CreateMessageData) {
    let {
      message_type,
      message_content,
      conversationId,
      participants,
      message_content_type,
    } = data;
    // Check user is Exist in conversation
    const conversation = await this.conversationRepository.findUserExist(
      conversationId,
      user._id,
    );
    // Not found group
    let newConversation = null;
    if (message_type === MessageType.GROUP && !conversation)
      throw new HttpException(
        'Conversation not found!',
        HttpStatus.BAD_REQUEST,
      );
    // Not found conversation
    if (message_type === MessageType.CONVERSATION && !conversation) {
      const payload: PayloadCreateConversation = {
        conversation_type: MessageType.CONVERSATION,
        participants,
        creators: null,
        avatarUrl: null,
        nameGroup: null,
      };
      const foundConversationOfTwoUser =
        await this.conversationService.getMatchConversation(
          participants[0].userId,
          participants[1].userId,
        );
      newConversation = foundConversationOfTwoUser
        ? foundConversationOfTwoUser
        : (await this.conversationService.createConversation(user, payload))
            .conversation;
    }
    const payload: PayloadCreateMessage = {
      message_type,
      message_content,
      conversationId: newConversation
        ? newConversation._id.toString()
        : conversationId,
      message_received: conversation?.participants ?? participants,
      message_content_type,
      message_call: data.message_call,
      message_sender_by: data.message_sender_by,
    };
    // Create new Message
    const message = await this.messageRepository.createMessageConversation(
      user,
      payload,
    );
    if (!message) {
      throw new HttpException(
        'Create message Error!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Update last message
    await this.conversationRepository.updateLastConversationMessage(
      user,
      newConversation ? newConversation._id.toString() : conversationId,
      this.convertObjectIdToString(message),
    );

    return message;
  }

  async update(user: IUserCreated, data: UpdateMessageData) {
    const { message_type, message_content, message_id, conversationId } = data;
    const conversation = await this.conversationRepository.findUserExist(
      conversationId,
      user._id,
    );
    if (!conversation)
      throw new HttpException(
        'Conversation not found!',
        HttpStatus.BAD_REQUEST,
      );

    const payload = {
      message_type,
      message_id,
      message_content,
      conversationId,
      participants: conversation.participants,
    };
    const messageUpdate = await this.messageRepository.updateMessage(payload);

    if (!messageUpdate)
      throw new HttpException('DB error!', HttpStatus.BAD_REQUEST);
    else {
      // if (conversation.lastMessage)
      // Update last message if update or delete lastMessage
      if (conversation.lastMessage._id === messageUpdate._id.toString()) {
        conversation.lastMessage = this.convertObjectIdToString(messageUpdate);
        await conversation.save();
      }
      return messageUpdate;
    }
  }

  async delete(user: IUserCreated, data: DelelteMessageData): Promise<any> {
    const { conversationId, message_id } = data;
    const conversation = await this.conversationRepository.findUserExist(
      conversationId,
      user._id,
    );
    const message = await this.messageRepository.findById(message_id);
    if (!conversation || !message)
      throw new HttpException(
        'Conversation not found!',
        HttpStatus.BAD_REQUEST,
      );

    const firstMessageOfConversation =
      await this.messageRepository.findFristMessage(conversationId);
    if (conversation.lastMessage._id === message_id) {
      // get first message
      // If conversation just created and delete message just send
      if (firstMessageOfConversation.length === 1) {
        if (conversation.conversation_type === MessageType.GROUP) {
          // Update last message
          conversation.lastMessage = null;
          await conversation.save();
        } else {
          // delete conversation
          await this.conversationRepository.deleteConversation(conversationId);
        }
        await this.messageRepository.delete(data);
        return {
          lastMessage: null,
          message,
        };
      } else {
        conversation.lastMessage = this.convertObjectIdToString(
          firstMessageOfConversation[1],
        );
        await conversation.save();
        await this.messageRepository.delete(data);
        return {
          lastMessage: firstMessageOfConversation[1],
          message,
        };
      }
    }
    // Else if had many message in conversation
    else {
      await this.messageRepository.delete(data);
      return {
        lastMessage: null,
        message,
      };
    }
  }

  async getImageOfConversation(userId: string, conversationId: string) {
    const foundConversation = await this.conversationRepository.findById(
      conversationId,
    );
    if (!foundConversation)
      throw new HttpException('Conversation not found!', HttpStatus.NOT_FOUND);

    let isExistInConversation = false;
    for (let participant of foundConversation.participants) {
      if (participant.userId === userId) {
        isExistInConversation = true;
      }
    }
    if (!isExistInConversation)
      throw new HttpException('You not permission!', HttpStatus.BAD_REQUEST);

    return await this.messageRepository.findAllImageOfConversation(
      conversationId,
    );
  }

  convertObjectIdToString(message: any) {
    const {
      _id,
      message_type: type,
      message_sender_by,
      message_content: content,
      message_conversation,
      message_content_type,
      message_received,
    } = message;
    return {
      _id: _id.toString(),
      message_type: type,
      message_sender_by,
      message_content: content,
      message_content_type,
      message_conversation,
      message_received,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
