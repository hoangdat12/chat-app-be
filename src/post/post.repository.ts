import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Post } from '../schema/post.model';
import { IPost, IUserCreated, Pagination } from '../ultils/interface';
import { DataCreatePost, IDataUpdatePost } from './post.dto';
import { PostMode, PostType } from '../ultils/constant';
import {
  checkNegativeNumber,
  getUsername,
  objectNotContainNull,
} from '../ultils';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<Post>,
  ) {}

  async findById(postId: string) {
    return await this.postModel
      .findById({ _id: postId })
      .populate({
        path: 'user',
        select: '_id email firstName lastName avatarUrl',
      })
      .lean();
  }

  async findByUserId(userId: string, pagiantion: Pagination) {
    const { limit, page, sortBy } = pagiantion;
    const offset = (page - 1) * limit;
    return await this.postModel
      .find({
        user: userId,
      })
      .populate({
        path: 'user',
        select: '_id email firstName lastName avatarUrl',
      })
      .sort(sortBy === 'ctime' ? { createdAt: -1 } : { createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
  }

  async findByUserIdV2(user: IUserCreated, pagiantion: Pagination, match: any) {
    const { limit, page, sortBy } = pagiantion;
    const offset = (page - 1) * limit;

    const posts = await this.postModel.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'User',
          localField: 'user',
          foreignField: '_id',
          as: 'userObj',
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ['$userObj', 0] },
          liked: {
            $anyElementTrue: {
              $map: {
                input: '$post_likes',
                as: 'like',
                in: {
                  $eq: ['$$like.userId', user._id],
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
    return posts;
  }

  async findPostSaveOfUser(
    user: IUserCreated,
    postUserId: string,
    pagiantion: Pagination,
  ) {
    const { limit, page, sortBy } = pagiantion;
    const offset = (page - 1) * limit;
    const objectIdUserId = new mongoose.Types.ObjectId(postUserId);

    return await this.postModel.aggregate([
      {
        $match: {
          user: objectIdUserId,
          post_type: PostType.SAVE,
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'user',
          foreignField: '_id',
          as: 'userObj',
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ['$userObj', 0] },
          liked: {
            $anyElementTrue: {
              $map: {
                input: '$post_likes',
                as: 'like',
                in: {
                  $eq: ['$$like.userId', user._id],
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
  }

  async create(user: IUserCreated, data: DataCreatePost, post_image: string) {
    const {
      post_content,
      post_mode = PostMode.PUBLIC,
      post_type = PostType.POST,
      post_share = null,
      post_tag,
    } = data;
    return await this.postModel.create({
      user: user._id,
      post_content,
      post_image,
      post_type,
      post_mode,
      post_share,
      post_tag,
    });
  }

  async delete(userId: string, postId: string) {
    return await this.postModel.deleteOne({ user: userId, _id: postId });
  }

  async update(userId: string, postId: string, data: IDataUpdatePost) {
    const objUpdate = objectNotContainNull(data);
    return await this.postModel.updateOne(
      {
        _id: postId,
        user: userId,
      },
      objUpdate,
      { new: true, upsert: true },
    );
  }

  async likePost(user: IUserCreated, postId: string, quantity: number) {
    return await this.postModel.findOneAndUpdate(
      {
        _id: postId,
      },
      {
        $inc: {
          post_likes_num: quantity,
        },
        $push: {
          post_likes: {
            userId: user._id,
            avatarUrl: user.avatarUrl,
            userName: getUsername(user),
          },
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  async decreLikePost(user: IUserCreated, postId: string, quantity: number) {
    return await this.postModel.findOneAndUpdate(
      {
        _id: postId,
      },
      {
        $inc: {
          post_likes_num: quantity,
        },
        $pull: {
          post_likes: {
            userId: user._id,
          },
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  async increShareNum(postId: string) {
    return await this.postModel.findOneAndUpdate(
      {
        _id: postId,
      },
      {
        $inc: {
          post_share_num: 1,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  async changePostMode(userId: string, postId: string, post_mode: string) {
    return await this.postModel.findOneAndUpdate(
      {
        user: userId,
        _id: postId,
      },
      {
        post_mode: post_mode,
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  async getPostOfFriend(user: IUserCreated, pagination: Pagination) {
    return this.postModel.find({});
  }

  async increQuantityCommentNum(postId: string, quantity: number = 1) {
    return this.postModel.findOneAndUpdate(
      {
        _id: postId,
      },
      {
        $inc: {
          post_comments_num: quantity,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }
}
