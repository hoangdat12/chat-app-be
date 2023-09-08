import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Friend as FriendV2 } from '../../schema/friend.model';
import { Model } from 'mongoose';
import { Pagination } from '../../ultils/interface';
// import { IFriend } from '../../ultils/interface/friend.interface';
import { checkNegativeNumber, convertObjectId } from '../../ultils';

@Injectable()
export class FriendRepository {
  constructor(
    @InjectModel(FriendV2.name)
    private readonly friendModelV2: Model<FriendV2>,
  ) {}

  async isFriend(userId: string, friendId: string) {
    return await this.friendModelV2.findOne({
      $or: [
        {
          friend_receiver: convertObjectId(userId),
          friend_sender: convertObjectId(friendId),
        },
        {
          friend_receiver: convertObjectId(friendId),
          friend_sender: convertObjectId(userId),
        },
      ],
    });
  }

  async findByName(userId: string, friendName: string, pagination: Pagination) {
    const { limit, page } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    const searchRegex = new RegExp(friendName, 'i');
    const userObjectId = convertObjectId(userId);

    const friends = await this.friendModelV2.aggregate([
      {
        $match: {
          $or: [
            { friend_receiver: userObjectId },
            { friend_sender: userObjectId },
          ],
        },
      },
      {
        $addFields: {
          friendToLookup: {
            $cond: {
              if: { $eq: ['$friend_receiver', userObjectId] },
              then: '$friend_sender',
              else: '$friend_receiver',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'friendToLookup',
          foreignField: '_id',
          as: 'friendObjects',
        },
      },
      {
        $unwind: '$friendObjects',
      },
      {
        $match: {
          $expr: {
            $regexMatch: {
              input: {
                $concat: [
                  '$friendObjects.firstName',
                  ' ',
                  '$friendObjects.lastName',
                ],
              },
              regex: searchRegex,
            },
          },
        },
      },
      {
        $project: {
          _id: '$friendObjects._id',
          email: '$friendObjects.email',
          firstName: '$friendObjects.firstName',
          lastName: '$friendObjects.lastName',
          avatarUrl: '$friendObjects.avatarUrl',
          peerId: '$friendObjects.peer',
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

    return friends;
  }

  async confirmFriend(userId: string, friendId: string) {
    return await this.friendModelV2.create({
      friend_receiver: convertObjectId(userId),
      friend_sender: convertObjectId(friendId),
    });
  }

  async deleteFriend(userId: string, friendId: string) {
    return await this.friendModelV2.deleteOne({
      $or: [
        {
          friend_receiver: convertObjectId(userId),
          friend_sender: convertObjectId(friendId),
        },
        {
          friend_receiver: convertObjectId(friendId),
          friend_sender: convertObjectId(userId),
        },
      ],
    });
  }

  async findFriends(userId: string) {
    return await this.friendModelV2
      .find({
        $or: [
          {
            friend_receiver: convertObjectId(userId),
          },
          {
            friend_sender: convertObjectId(userId),
          },
        ],
      })
      .populate({
        path: 'friend_receiver',
        select: '_id email firstName lastName avatarUrl',
      });
  }

  async findFriendsV2(userId: string) {
    const userObjectId = convertObjectId(userId);
    return await this.friendModelV2.aggregate([
      {
        $match: {
          $or: [
            { friend_receiver: userObjectId },
            { friend_sender: userObjectId },
          ],
        },
      },
      {
        $addFields: {
          friendToLookup: {
            $cond: {
              if: { $eq: ['$friend_receiver', userObjectId] },
              then: '$friend_sender',
              else: '$friend_receiver',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'friendToLookup',
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
          peer: 1,
        },
      },
      {
        $addFields: {
          userName: { $concat: ['$firstName', ' ', '$lastName'] },
          peerId: '$peer',
        },
      },
    ]);
  }

  async findFriendIds(userId: string) {
    const userObjectId = convertObjectId(userId);
    return await this.friendModelV2.aggregate([
      {
        $match: {
          $or: [
            { friend_receiver: userObjectId },
            { friend_sender: userObjectId },
          ],
        },
      },
      {
        $addFields: {
          friendToLookup: {
            $cond: {
              if: { $eq: ['$friend_receiver', userObjectId] },
              then: '$friend_sender',
              else: '$friend_receiver',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'friendToLookup',
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
        $group: {
          _id: null,
          friendIds: { $push: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          friendIds: 1,
        },
      },
    ]);
  }
}
