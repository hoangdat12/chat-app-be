import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Delete,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Request } from 'express';
import {
  DataCreateComment,
  DataDeleteComment,
  DataUpdateComment,
} from './comment.dto';
import { IUserCreated } from '../ultils/interface';
import { validate } from 'class-validator';
import { Created, Ok } from '../ultils/response';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('/comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  async createComment(@Req() req: Request, @Body() body: DataCreateComment) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const { notify, responseData } = await this.commentService.createComment(
        user,
        body,
      );
      if (notify) {
        this.eventEmitter.emit('comment.create', notify);
      }
      return new Created(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Get('/:postId')
  async getListComment(
    @Req() req: Request,
    @Param('postId') postId: string,
    @Query('parentCommentId') parentCommentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    try {
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
      };
      const user = req.user as IUserCreated;
      return new Ok(
        await this.commentService.getListCommentOfPost(
          user,
          postId,
          parentCommentId,
          pagination,
        ),
      );
    } catch (err) {
      throw err;
    }
  }

  @Patch()
  async updateComment(@Req() req: Request, @Body() data: DataUpdateComment) {
    try {
      const errors = await validate(data);
      if (errors.length) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return new Ok(await this.commentService.updateComment(user, data));
    } catch (err) {
      throw err;
    }
  }

  @Delete()
  async deleteComment(@Req() req: Request, @Body() data: DataDeleteComment) {
    try {
      const errors = await validate(data);
      if (errors.length) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return new Ok(await this.commentService.deleteComment(user, data));
    } catch (err) {
      throw err;
    }
  }

  @Post('/like')
  async likeComment(@Req() req: Request, @Body() data: DataDeleteComment) {
    try {
      const errors = await validate(data);
      if (errors.length) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const { status, responseData, notify } =
        await this.commentService.likeComment(user, data);
      if (status === 'Like' && notify) {
        // Notify
        this.eventEmitter.emit('comment.like', notify);
      }
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Get('/bug/fix')
  async fixBug() {
    return await this.commentService.fixBugComment();
  }
}
