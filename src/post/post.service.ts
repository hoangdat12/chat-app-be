import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IPost, IUserCreated, Pagination } from '../ultils/interface';
import { DataCreatePost, IDataUpdatePost } from './post.dto';
import { PostRepository } from './post.repository';
import { AuthRepository } from '../auth/repository/auth.repository';
import { RedisService } from '../redis/redis.service';
import { NotifyType, PostMode, PostType } from '../ultils/constant';
import { ProfileRepository } from '../profile/repository/profile.repository';
import mongoose from 'mongoose';
import { getUsername } from '../ultils';
import { NotifyService } from '../notify/notify.service';

@Injectable()
export class PostService {
  constructor(
    private readonly postReposotpory: PostRepository,
    private readonly userRepository: AuthRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly redisService: RedisService,
    private readonly notifyService: NotifyService,
  ) {}

  async findPostByUserId(
    user: IUserCreated,
    postUserId: string,
    pagination: Pagination,
  ) {
    if (!postUserId)
      throw new HttpException('Missing request value!', HttpStatus.NOT_FOUND);
    const foundUser = await this.userRepository.findById(postUserId);
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const objectIdUserId = new mongoose.Types.ObjectId(postUserId);
    const match =
      user._id === postUserId
        ? {
            $or: [
              {
                user: objectIdUserId,
                $or: [
                  { post_type: PostType.POST },
                  { post_type: PostType.SHARE },
                ],
              },
              {
                'post_tag._id': postUserId,
              },
            ],
          }
        : {
            $or: [
              {
                user: objectIdUserId,
                post_mode: PostMode.PUBLIC,
                $or: [
                  { post_type: PostType.POST },
                  { post_type: PostType.SHARE },
                ],
              },
              {
                'post_tag._id': postUserId,
              },
            ],
          };

    const posts = await this.postReposotpory.findByUserIdV2(
      user,
      pagination,
      match,
    );

    for (let post of posts) {
      if (post.post_type !== PostType.POST) {
        post.post_share = await this.postReposotpory.findById(post.post_share);
      }
    }
    return posts;
  }

  async findPostSaveOfUser(
    user: IUserCreated,
    postUserId: string,
    pagination: Pagination,
  ) {
    if (!postUserId)
      throw new HttpException('Missing request value!', HttpStatus.NOT_FOUND);
    const foundUser = await this.userRepository.findById(postUserId);
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const posts = await this.postReposotpory.findPostSaveOfUser(
      user,
      postUserId,
      pagination,
    );
    for (let post of posts) {
      post.post_share = await this.postReposotpory.findById(post.post_share);
    }
    return posts;
  }

  async createPost(
    user: IUserCreated,
    data: DataCreatePost,
    post_image: string | null,
  ) {
    if (data.post_type === PostType.SHARE && !data.post_share)
      throw new HttpException('Missing request value!', HttpStatus.BAD_REQUEST);

    if (!data.post_content && !post_image && data.post_type === PostType.POST)
      throw new HttpException('Missing request value!', HttpStatus.BAD_REQUEST);

    let newPost = await this.postReposotpory.create(user, data, post_image);

    if (!newPost)
      throw new HttpException('Db error!', HttpStatus.INTERNAL_SERVER_ERROR);

    if (data.post_type === PostType.POST) {
      this.profileRepository.updateQuantityPost(user._id, 1);
    }
    // Incre share num
    else if (data.post_type === PostType.SHARE) {
      const key = `post:${newPost.post_share._id.toString()}user:${user._id}`;
      if (await this.redisService.get(key)) {
        return this.convertObjectIdToString(newPost, user, data.post_share);
      } else {
        await this.redisService.set(key, 'shared', 600);
        await this.postReposotpory.increShareNum(data.post_share._id);
      }
    }
    return this.convertObjectIdToString(newPost, user, data.post_share);
  }

  async deletePost(user: IUserCreated, postId: string) {
    const foundPost = await this.postReposotpory.findById(postId);
    if (!foundPost)
      throw new HttpException('Post not found!', HttpStatus.NOT_FOUND);
    if (user._id !== foundPost.user._id.toString())
      throw new HttpException('User not permission!', HttpStatus.BAD_REQUEST);

    if (foundPost.post_type === PostType.POST) {
      this.profileRepository.updateQuantityPost(user._id, -1);
    }

    return await this.postReposotpory.delete(user._id, postId);
  }

  async updatePost(user: IUserCreated, postId: string, data: IDataUpdatePost) {
    const foundPost = await this.postReposotpory.findById(postId);
    if (!foundPost)
      throw new HttpException('Post not found!', HttpStatus.NOT_FOUND);

    if (user._id !== foundPost.user._id)
      throw new HttpException('User not permission!', HttpStatus.BAD_REQUEST);

    return await this.postReposotpory.update(user._id, postId, data);
  }

  async likePost(user: IUserCreated, postId: string, quantity: number) {
    if (quantity !== -1 && quantity !== 1)
      throw new HttpException(
        'Quantity increse like not valid!',
        HttpStatus.BAD_REQUEST,
      );

    const foundPost = await this.postReposotpory.findById(postId);
    if (!foundPost)
      throw new HttpException('Post not found!', HttpStatus.NOT_FOUND);

    let notify = null;
    if (foundPost.user._id.toString() !== user._id) {
      const notifyData = {
        notifyType: NotifyType.LIKE_IMAGE,
        ownerNotify: { userId: foundPost.user._id.toString() },
        notifyLink: {
          parrentCommentId: null,
          commentId: null,
          postId: postId,
        },
        post: {
          userId: foundPost.user._id,
          userName: getUsername(foundPost.user),
        },
        notify_friend: null,
      };
      notify = await this.notifyService.createNotify(
        {
          userId: user._id,
          avatarUrl: user.avatarUrl,
          userName: getUsername(user),
        },
        notifyData,
      );
    }

    if (quantity === -1) {
      return {
        responseData: await this.postReposotpory.decreLikePost(
          user,
          postId,
          -1,
        ),
        notify,
      };
    } else
      return {
        responseData: await this.postReposotpory.likePost(user, postId, 1),
        notify,
      };
  }

  async changePostMode(user: IUserCreated, postId: string, post_mode: string) {
    const foundPost = await this.postReposotpory.findById(postId);
    if (!foundPost)
      throw new HttpException('Post not found!', HttpStatus.NOT_FOUND);
    if (foundPost.user._id.toString() !== user._id)
      throw new HttpException('You not permission!', HttpStatus.BAD_REQUEST);
    return await this.postReposotpory.changePostMode(
      user._id,
      postId,
      post_mode,
    );
  }

  async getPostOfFriend(user: IUserCreated, pagination: Pagination) {
    return await this.postReposotpory.getPostOfFriend(user, pagination);
  }

  async getAllPost(user: IUserCreated, pagination: Pagination) {
    const match = {
      $and: [
        {
          $or: [{ post_mode: PostMode.FRIEND }, { post_mode: PostMode.PUBLIC }],
        },
        {
          $or: [{ post_type: PostType.POST }, { post_type: PostType.SHARE }],
        },
      ],
    };
    const posts = await this.postReposotpory.findByUserIdV2(
      user,
      pagination,
      match,
    );
    for (let post of posts) {
      if (post.post_type !== PostType.POST) {
        post.post_share = await this.postReposotpory.findById(post.post_share);
      }
    }

    return posts;
  }

  // Private
  convertObjectIdToString(
    post: any,
    user: IUserCreated,
    post_share: IPost | null,
  ): IPost {
    return {
      _id: post._id,
      user,
      post_content: post.post_content,
      post_image: post.post_image,
      post_likes: post.post_likes,
      post_type: post.post_type,
      post_mode: post.post_mode,
      post_comments_num: post.post_comments_num,
      post_likes_num: post.post_likes_num,
      post_share_num: post.post_share_num,
      post_tag: post.post_tag,
      post_share: post_share,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
