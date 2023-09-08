import {
  Controller,
  Post,
  Req,
  Body,
  Param,
  Delete,
  Patch,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PostService } from './post.service';
import { Request } from 'express';
import { IUserCreated } from '../ultils/interface';
import { DataCreatePost, IDataUpdatePost } from './post.dto';
import { Ok } from '../ultils/response';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly eventEmiter: EventEmitter2,
  ) {}

  @Get('/all')
  async getAllPost(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
      };
      return new Ok(await this.postService.getAllPost(user, pagination));
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createPost(
    @Req() req: Request,
    @Body('data') data: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const body = JSON.parse(data) as DataCreatePost;
      let post_image = null;
      if (file) {
        const image = await this.cloudinaryService.uploadFile(file);
        post_image = image.url;
      }

      const user = req.user as IUserCreated;
      const responseData = await this.postService.createPost(
        user,
        body,
        post_image,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Get('/:userId')
  async findPostOfUser(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
      };
      const responseData = await this.postService.findPostByUserId(
        user,
        userId,
        pagination,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Get('/save/:userId')
  async findPostSaveOfUser(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
      };
      const responseData = await this.postService.findPostSaveOfUser(
        user,
        userId,
        pagination,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Delete('/:postId')
  async deletePost(@Req() req: Request, @Param('postId') postId: string) {
    try {
      const user = req.user as IUserCreated;
      const responseData = await this.postService.deletePost(user, postId);
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Patch('/:postId')
  async updatePost(
    @Req() req: Request,
    @Param('postId') postId: string,
    @Body() body: IDataUpdatePost,
  ) {
    try {
      const user = req.user as IUserCreated;
      const responseData = await this.postService.updatePost(
        user,
        postId,
        body,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Patch('/change-mode/:postId')
  async changePostMode(
    @Req() req: Request,
    @Param('postId') postId: string,
    @Body('post_mode') post_mode: string,
  ) {
    try {
      if (!post_mode)
        throw new HttpException(
          'Missing request value!',
          HttpStatus.BAD_REQUEST,
        );
      const user = req.user as IUserCreated;
      const responseData = await this.postService.changePostMode(
        user,
        postId,
        post_mode,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Post('/like/:postId')
  async likePost(
    @Req() req: Request,
    @Param('postId') postId: string,
    @Body('quantity') quantity: number,
  ) {
    try {
      const user = req.user as IUserCreated;
      const { responseData, notify } = await this.postService.likePost(
        user,
        postId,
        quantity,
      );
      // this.eventEmiter.emit('notify.received', { notify });
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }
}
