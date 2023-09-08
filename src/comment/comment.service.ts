import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { IComment, IUserCreated, Pagination } from '../ultils/interface';
import {
  DataCreateComment,
  DataDeleteComment,
  DataUpdateComment,
} from './comment.dto';
import { PostRepository } from '../post/post.repository';
import { CommentType, NotifyType } from '../ultils/constant';
import { getContentNotify, getMessageNotify, getUsername } from '../ultils';
import { NotifyService } from '../notify/notify.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postRepository: PostRepository,
    private readonly notifyService: NotifyService,
  ) {}

  async createComment(user: IUserCreated, data: DataCreateComment) {
    const { comment_parent_id, comment_post_id } = data;
    const { foundPost, foundComment: foundParrentComment } =
      await this.checkPostAndCommentFound({
        comment_id: comment_parent_id,
        comment_post_id,
      });
    let rightValue: number = 1;
    // Reply
    if (comment_parent_id) {
      const parentComment = await this.commentRepository.findById(
        comment_parent_id,
      );
      if (!parentComment)
        throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);

      rightValue = parentComment.comment_right;

      // Update all child comment
      const promises = [
        this.commentRepository.updateManyChildCommentRight(
          comment_post_id,
          rightValue,
          2,
        ),
        this.commentRepository.updateManyChildCommentLeft(
          comment_post_id,
          rightValue,
          2,
        ),
      ];
      await Promise.all(promises);
    } else {
      // Get max right value
      const maxRightValue = await this.commentRepository.findMaxRightValue(
        comment_post_id,
      );
      if (maxRightValue) {
        rightValue = maxRightValue.comment_right + 1;
      }
    }
    let notify = null;
    await this.postRepository.increQuantityCommentNum(comment_post_id);
    const comment = await this.commentRepository.create(user, data, rightValue);
    // Create notify
    if (foundPost.user._id.toString() === user._id && !comment_parent_id)
      return {
        notify: null,
        responseData: this.convertCommentToString(comment, user),
      };
    else if (foundPost.user._id.toString() !== user._id && !comment_parent_id) {
      // Comment on post
      const notifyData = {
        notifyType: comment_parent_id
          ? NotifyType.COMMENT_REPLY
          : NotifyType.COMMENT,
        ownerNotify: { userId: foundPost.user._id.toString() },
        notifyLink: {
          parrentCommentId: comment_parent_id,
          commentId: comment._id.toString(),
          postId: comment_post_id,
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
    } else {
      // Reply comment
      const notifyData = {
        notifyType: comment_parent_id
          ? NotifyType.COMMENT_REPLY
          : NotifyType.COMMENT,
        ownerNotify: {
          userId: foundParrentComment.comment_user_id.toString(),
        },
        notifyLink: {
          parrentCommentId: comment_parent_id,
          commentId: comment._id.toString(),
          postId: comment_post_id,
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

    return {
      notify,
      responseData: this.convertCommentToString(comment, user),
    };
  }

  async getListCommentOfPost(
    user: IUserCreated,
    postId: string,
    parentCommentId: string,
    pagination: Pagination,
  ) {
    const foundPost = await this.postRepository.findById(postId);
    if (!foundPost)
      throw new HttpException('Post not found!', HttpStatus.BAD_REQUEST);

    pagination.limit = pagination.limit + 10;
    let comments = [];
    let parentComment = null;
    if (!parentCommentId) {
      comments = await this.commentRepository.findParentCommentV2(
        user,
        postId,
        pagination,
      );
    } else {
      const foundParentComment = await this.commentRepository.findById(
        parentCommentId,
      );
      if (!foundParentComment)
        throw new HttpException('Comment not found!', HttpStatus.NOT_FOUND);
      comments = await this.commentRepository.findChildCommentV2(
        user,
        postId,
        parentCommentId,
        foundParentComment.comment_left,
        foundParentComment.comment_right,
        pagination,
      );
      parentComment = foundParentComment;
    }
    if (comments.length <= 10)
      return {
        parentComment,
        comments,
        remainComment: 0,
      };
    else
      return {
        parentComment,
        comments: comments.slice(0, 11),
        remainComment: comments.length - 10,
      };
  }

  async updateComment(user: IUserCreated, data: DataUpdateComment) {
    const { comment_content } = data;

    if (comment_content.trim() === '')
      throw new HttpException('Invalid content!', HttpStatus.BAD_REQUEST);

    const { foundComment } = await this.checkPostAndCommentFound(data);

    if (foundComment.comment_type !== CommentType.TEXT)
      throw new HttpException('Not valid!', HttpStatus.BAD_REQUEST);

    if (foundComment.comment_user_id.toString() !== user._id)
      throw new HttpException('You not permission!', HttpStatus.BAD_REQUEST);

    foundComment.comment_content = comment_content;
    foundComment.save();

    return this.convertCommentToString(foundComment, user);
  }

  async deleteComment(user: IUserCreated, data: DataDeleteComment) {
    const { comment_post_id } = data;

    const { foundComment } = await this.checkPostAndCommentFound(data);

    const leftValue = foundComment.comment_left;
    const rightValue = foundComment.comment_right;
    const width = rightValue - leftValue + 1;

    // Delete all comment and child Comment
    await this.commentRepository.deleteComment(
      comment_post_id,
      leftValue,
      rightValue,
    );

    // Change left and right value
    const promise = [
      this.commentRepository.updateManyChildCommentLeft(
        comment_post_id,
        rightValue,
        -width,
      ),
      this.commentRepository.updateManyChildCommentRight(
        comment_post_id,
        rightValue,
        -width,
      ),
    ];

    await Promise.all(promise);
    // increment quantity comment
    await this.postRepository.increQuantityCommentNum(
      comment_post_id,
      -Math.floor(width / 2),
    );

    return foundComment;
  }

  async likeComment(
    user: IUserCreated,
    data: DataDeleteComment,
  ): Promise<{
    status: string;
    responseData: any;
    notify: any;
  }> {
    const { foundPost, foundComment } = await this.checkPostAndCommentFound(
      data,
    );
    const isLiked = await this.commentRepository.isLiked(user, data);
    // If isLiked then cancel like
    if (isLiked) {
      // Cancel like
      return {
        status: 'UnLike',
        responseData: await this.commentRepository.cancelLikeComment(
          user,
          data,
        ),
        notify: null,
      };
    } else {
      // Like
      let notify = null;
      if (foundComment.comment_user_id.toString() !== user._id) {
        const notifyData = {
          notifyType: NotifyType.COMMENT_EMOJI,
          ownerNotify: { userId: foundComment.comment_user_id.toString() },
          notifyLink: {
            parrentCommentId: foundComment.comment_parent_id,
            commentId: foundComment._id.toString(),
            postId: data.comment_post_id,
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

      return {
        status: 'Like',
        responseData: await this.commentRepository.likeComment(user, data),
        notify,
      };
    }
  }

  async fixBugComment() {
    return await this.commentRepository.updateMany();
  }

  async checkPostAndCommentFound(data: DataDeleteComment) {
    const { comment_post_id, comment_id } = data;
    const foundPost = await this.postRepository.findById(comment_post_id);
    if (!foundPost)
      throw new HttpException('Post not found!', HttpStatus.NOT_FOUND);

    let foundComment = null;
    if (comment_id) {
      foundComment = await this.commentRepository.findById(comment_id);
      if (!foundComment)
        throw new HttpException('Comment not found!', HttpStatus.NOT_FOUND);
    }

    return { foundPost, foundComment };
  }

  convertCommentToString(comment: any, user: IUserCreated) {
    return {
      _id: comment._id,
      comment_post_id: comment.comment_post_id,
      comment_user_id: user,
      comment_type: comment.comment_type,
      comment_content: comment.comment_content,
      comment_left: comment.comment_left,
      comment_right: comment.comment_right,
      comment_parent_id: comment.comment_parent_id,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
