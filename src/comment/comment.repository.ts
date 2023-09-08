import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../schema/comment.model';
import { DataCreateComment, DataDeleteComment } from './comment.dto';
import { IUserCreated, IUserLikePost, Pagination } from '../ultils/interface';
import { convertObjectId, getUsername } from '../ultils';
import { User } from '../schema/user.model';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<Comment>,
  ) {}

  async create(
    user: IUserCreated,
    data: DataCreateComment,
    rightValue: number,
  ) {
    return await this.commentModel.create({
      ...data,
      comment_left: rightValue,
      comment_right: rightValue + 1,
      comment_user_id: user._id,
    });
  }

  async findMaxRightValue(postId: string) {
    return await this.commentModel.findOne(
      {
        comment_post_id: convertObjectId(postId),
      },
      'comment_right',
      { $sort: { comment_right: -1 } },
    );
  }

  async findById(commentId: string) {
    return await this.commentModel.findById(commentId);
  }

  async updateManyChildCommentRight(
    postId: string,
    rightValue: number,
    quantity: number,
  ) {
    return await this.commentModel.updateMany(
      {
        comment_post_id: convertObjectId(postId),
        comment_right: { $gte: rightValue },
      },
      {
        $inc: {
          comment_right: quantity,
        },
      },
    );
  }

  async updateManyChildCommentLeft(
    postId: string,
    rightValue: number,
    quantity: number,
  ) {
    return await this.commentModel.updateMany(
      {
        comment_post_id: convertObjectId(postId),
        comment_left: { $gt: rightValue },
      },
      {
        $inc: {
          comment_left: quantity,
        },
      },
    );
  }

  async findParentComment(postId: string, pagination: Pagination) {
    const { page, limit, sortBy } = pagination;
    const offset = (page - 1) * limit;
    return await this.commentModel
      .find({
        comment_post_id: convertObjectId(postId),
        comment_parent_id: null,
      })
      .populate('comment_user_id')
      .sort(sortBy === 'ctime' ? { createdAt: -1 } : { createdAt: 1 })
      .skip(offset)
      .limit(limit)
      // .select({})
      .lean();
  }

  async findParentCommentV2(
    user: IUserCreated,
    postId: string,
    pagination: Pagination,
  ) {
    const { page, limit, sortBy } = pagination;
    const offset = (page - 1) * limit;
    const comments = await this.commentModel.aggregate([
      {
        $match: {
          comment_post_id: convertObjectId(postId),
          comment_parent_id: null,
        },
      },
      {
        $lookup: {
          from: User.name,
          localField: 'comment_user_id',
          foreignField: '_id',
          as: 'userObj',
        },
      },
      {
        $addFields: {
          comment_user_id: {
            $arrayElemAt: ['$userObj', 0],
          },
          isLiked: {
            $anyElementTrue: {
              $map: {
                input: '$comment_likes',
                as: 'liker',
                in: {
                  $eq: ['$$liker.userId', user._id],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          userObj: 0,
        },
      },
      {
        $sort: sortBy === 'ctime' ? { createdAt: -1 } : { createdAt: 1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);
    return comments;
  }

  async findChildCommentV2(
    user: IUserCreated,
    postId: string,
    parentCommentId: string,
    left: number,
    right: number,
    pagination: Pagination,
  ) {
    const { page, limit, sortBy } = pagination;
    const offset = (page - 1) * limit;
    const comments = await this.commentModel.aggregate([
      {
        $match: {
          comment_post_id: convertObjectId(postId),
          comment_parent_id: convertObjectId(parentCommentId),
          comment_left: { $gt: left },
          comment_right: { $lte: right },
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'comment_user_id',
          foreignField: '_id',
          as: 'userObj',
        },
      },
      {
        $addFields: {
          comment_user_id: {
            $arrayElemAt: ['$userObj', 0],
          },
          isLiked: {
            $anyElementTrue: {
              $map: {
                input: '$comment_likes',
                as: 'liker',
                in: {
                  $eq: ['$$liker.userId', user._id],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          userObj: 0,
        },
      },
      {
        $sort: sortBy === 'ctime' ? { createdAt: -1 } : { createdAt: 1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);
    return comments;
  }

  async findChildComment(
    postId: string,
    parentCommentId: string,
    left: number,
    right: number,
    pagination: Pagination,
  ) {
    const { page, limit, sortBy } = pagination;
    const offset = (page - 1) * limit;
    return await this.commentModel
      .find({
        comment_post_id: convertObjectId(postId),
        comment_parent_id: parentCommentId,
        comment_left: { $gt: left },
        comment_right: { $lte: right },
      })
      .populate('comment_user_id')
      .sort(sortBy === 'ctime' ? { createdAt: -1 } : { createdAt: 1 })
      .skip(offset)
      .limit(limit)
      // .select({})
      .lean();
  }

  async deleteComment(postId: string, leftValue: number, rightValue: number) {
    return await this.commentModel.deleteMany({
      comment_post_id: convertObjectId(postId),
      comment_left: { $gte: leftValue, $lte: rightValue },
    });
  }

  async isLiked(user: IUserCreated, data: DataDeleteComment) {
    return await this.commentModel
      .findOne({
        _id: convertObjectId(data.comment_id),
        comment_post_id: convertObjectId(data.comment_post_id),
        'comment_likes.userId': user._id,
      })
      .lean();
  }

  async likeComment(user: IUserCreated, data: DataDeleteComment) {
    const userLikeComment: IUserLikePost = {
      userId: user._id,
      avatarUrl: user.avatarUrl,
      userName: getUsername(user),
    };
    return await this.commentModel
      .findOneAndUpdate(
        {
          _id: convertObjectId(data.comment_id),
          comment_post_id: convertObjectId(data.comment_post_id),
        },
        {
          $push: {
            comment_likes: userLikeComment,
          },
          $inc: {
            comment_likes_num: 1,
          },
        },
        {
          new: true,
          upsert: true,
        },
      )
      .lean();
  }

  async cancelLikeComment(user: IUserCreated, data: DataDeleteComment) {
    return await this.commentModel
      .findOneAndUpdate(
        {
          _id: convertObjectId(data.comment_id),
          comment_post_id: convertObjectId(data.comment_post_id),
        },
        {
          $pull: {
            comment_likes: {
              userId: user._id,
            },
          },
          $inc: {
            comment_likes_num: -1,
          },
        },
        {
          new: true,
          upsert: true,
        },
      )
      .lean();
  }

  async updateMany() {
    return await this.commentModel.updateMany(
      {},
      {
        comment_likes_num: 0,
        comment_likes: [],
      },
    );
  }
}
