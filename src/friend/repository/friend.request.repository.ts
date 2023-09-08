import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FriendRequest } from '../../schema/friend.request.model';
import { Model } from 'mongoose';
import { checkNegativeNumber, convertObjectId } from '../../ultils';
import { FriendStatus } from '../../ultils/constant';
import { Pagination } from '../../ultils/interface';

@Injectable()
export class FriendRequestRepository {
  constructor(
    @InjectModel(FriendRequest.name)
    private readonly friendRequestModel: Model<FriendRequest>,
  ) {}

  async findById(userId: string, friendId: string) {
    return await this.friendRequestModel.findOne({
      $or: [
        {
          receiver: convertObjectId(userId),
          sender: convertObjectId(friendId),
        },
        {
          receiver: convertObjectId(friendId),
          sender: convertObjectId(userId),
        },
      ],
    });
  }

  async addFriend(userId: string, friendId: string) {
    return await this.friendRequestModel.create({
      receiver: convertObjectId(friendId),
      sender: convertObjectId(userId),
      status: FriendStatus.PENDING,
    });
  }

  async refuseFriend(userId: string, friendId: string) {
    return await this.friendRequestModel.deleteOne({
      $or: [
        {
          receiver: convertObjectId(userId),
          sender: convertObjectId(friendId),
        },
        {
          receiver: convertObjectId(friendId),
          sender: convertObjectId(userId),
        },
      ],
    });
  }

  async cancelFriend(userId: string, friendId: string, status: string) {
    return await this.friendRequestModel.findOneAndUpdate(
      {
        $or: [
          {
            receiver: convertObjectId(userId),
            sender: convertObjectId(friendId),
          },
          {
            receiver: convertObjectId(friendId),
            sender: convertObjectId(userId),
          },
        ],
      },
      {
        status: FriendStatus.REJECTED,
      },
    );
  }

  async findPendingFriends(userId: string, pagination: Pagination) {
    const { limit, page } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    return await this.friendRequestModel
      .find({
        sender: convertObjectId(userId),
      })
      .populate({
        path: 'receiver',
        select: '_id email firstName lastName avatarUrl',
      })
      .select({
        _id: 0,
        receiver: 1,
      })
      .skip(offset)
      .limit(limit);
  }

  async findPendingFriendsV2(userId: string, pagination: Pagination) {
    const { limit, page } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    return await this.friendRequestModel.aggregate([
      {
        $match: {
          sender: convertObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'receiver',
          foreignField: '_id',
          as: 'friendObjects',
        },
      },
      {
        $replaceRoot: {
          newRoot: { $arrayElemAt: ['$friendObjects', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          avatarUrl: 1,
        },
      },
      {
        $addFields: {
          userName: { $concat: ['$firstName', ' ', '$lastName'] },
        },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);
  }

  async findAccepFriends(userId: string, pagination: Pagination) {
    const { limit, page } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    return await this.friendRequestModel
      .find({
        receiver: convertObjectId(userId),
      })
      .populate({
        path: 'sender',
        select: '_id email firstName lastName avatarUrl',
      })
      .select({
        _id: 0,
        receiver: 1,
      })
      .skip(offset)
      .limit(limit);
  }

  async findAccepFriendsV2(userId: string, pagination: Pagination) {
    const { limit, page } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    return await this.friendRequestModel.aggregate([
      {
        $match: {
          receiver: convertObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'sender',
          foreignField: '_id',
          as: 'friendObjects',
        },
      },
      {
        $replaceRoot: {
          newRoot: { $arrayElemAt: ['$friendObjects', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          avatarUrl: 1,
        },
      },
      {
        $addFields: {
          userName: { $concat: ['$firstName', ' ', '$lastName'] },
        },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);
  }
}
