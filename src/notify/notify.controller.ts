import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { NotifyService } from './notify.service';
import { validate } from 'class-validator';
import { IUserCreated } from 'src/ultils/interface';
import { Request } from 'express';
import { DataCreateNotify } from './notify.dto';
import { Ok } from 'src/ultils/response';
import { getUsername } from 'src/ultils';

@Controller('notify')
export class NotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Post()
  async createNotify(@Req() req: Request, @Body() body: DataCreateNotify) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const userNotify = {
        userId: user._id,
        userName: getUsername(user),
        avatarUrl: user.avatarUrl,
      };
      const responseData = await this.notifyService.createNotify(
        userNotify,
        body,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Delete('/:notifyId')
  async deleteNotify(@Req() req: Request, @Param('notifyId') notifyId: string) {
    try {
      const user = req.user as IUserCreated;
      const responseData = await this.notifyService.deleteNotify(
        user._id,
        notifyId,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Get()
  async getNotify(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    try {
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      const user = req.user as IUserCreated;
      const responseData = await this.notifyService.getNotify(user, pagination);
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Patch('/:notifyId')
  async readNotify(@Req() req: Request, @Param('notifyId') notifyId: string) {
    try {
      const user = req.user as IUserCreated;
      const responseData = await this.notifyService.readNotify(user, notifyId);
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }
}
