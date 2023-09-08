import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Messages } from '../schema/message.model';
import { Model } from 'mongoose';
import {
  DelelteMessageData,
  PayloadCreateMessage,
  UpdateMessageData,
} from './message.dto';
import { IUserCreated, Pagination } from '../ultils/interface';
import { checkNegativeNumber, getUsername } from '../ultils';
import { MessageContentType } from '../ultils/constant';

export interface IDataDeleteMessage {
  messageType: string;
  messageId: string;
  conversationId: string;
}

export interface IDateUpdateMessage extends IDataDeleteMessage {
  messageContent: string;
}

@Injectable()
export class MessageRepository {
  constructor(
    @InjectModel(Messages.name)
    private readonly messageModel: Model<Messages>,
  ) {}

  // COMMON
  async findById(messageId: string) {
    return await this.messageModel.findById(messageId).lean();
  }
  // Xoa tam thoi
  async deleteConversation(conversationId: string, participantId: string) {
    return await this.messageModel.updateMany(
      {
        message_conversation: conversationId,
        message_received: {
          $elemMatch: {
            enable: true,
            userId: participantId.toString(),
          },
        },
      },
      { $set: { 'message_received.$[elem].enable': false } },
      {
        multi: true,
        arrayFilters: [{ 'elem.userId': participantId.toString() }],
      },
    );
  }
  // Xoa han
  async deleteConversationOfUser(userId: string, conversationId: string) {
    return await this.messageModel.updateMany(
      {
        message_conversation: conversationId,
        message_received: {
          $elemMatch: {
            enable: true,
            userId: userId.toString(),
          },
        },
      },
      { $set: { 'message_received.$[elem].enable': false } },
      {
        multi: true,
        arrayFilters: [{ 'elem.userId': userId.toString() }],
      },
    );
  }

  async findMessageOfConversation(
    userId: string,
    conversationId: string,
    pagination: Pagination,
  ) {
    const { page, limit, sortBy } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    return await this.messageModel
      .find({
        message_conversation: conversationId,
        message_received: {
          $elemMatch: {
            enable: true,
            userId: userId.toString(),
          },
        },
      })
      .limit(limit)
      .skip(offset)
      .sort(sortBy === 'ctime' ? { createdAt: -1 } : { id: 1 })
      .lean()
      .exec();
  }

  async updateMessage(data: UpdateMessageData) {
    return await this.messageModel.findOneAndUpdate(
      { _id: data.message_id },
      { message_content: data.message_content },
      { new: true },
    );
  }

  async delete(data: DelelteMessageData) {
    return await this.messageModel.deleteOne({
      _id: data.message_id,
      message_conversation: data.conversationId,
    });
  }

  async createMessageConversation(
    user: IUserCreated,
    data: PayloadCreateMessage,
  ) {
    const message_sender_by = data.message_sender_by ?? {
      userId: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      userName: getUsername(user),
      enable: true,
    };
    const { conversationId, ...payload } = data;
    return await this.messageModel.create({
      ...payload,
      message_conversation: conversationId,
      message_sender_by,
    });
  }

  async findFristMessage(conversationId: string) {
    return await this.messageModel
      .find({ message_conversation: conversationId })
      .sort({ updatedAt: -1 })
      .limit(2)
      .lean()
      .exec();
  }

  async findAllImageOfConversation(conversationId: string) {
    return await this.messageModel.find({
      message_conversation: conversationId,
      message_content_type: MessageContentType.IMAGE,
    });
  }
}
