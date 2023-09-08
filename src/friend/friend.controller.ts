import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Query,
  Delete,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { IUserCreated } from '../ultils/interface';
import { Request } from 'express';
import { Ok } from 'src/ultils/response';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('friend')
export class FriendController {
  constructor(
    private readonly friendService: FriendService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get('/pending')
  async findPendingFriends(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'name',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      return new Ok(
        await this.friendService.findPendingFriends(user._id, pagination),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/request')
  async findAccepFriends(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'name',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      return new Ok(
        await this.friendService.findAccepFriends(user._id, pagination),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/search')
  async findByName(
    @Req() req: Request,
    @Query('q') keyword: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'name',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      return new Ok(
        await this.friendService.findFriend(user, keyword, pagination),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/status/:friendId')
  async statusFriend(@Req() req: Request, @Param('friendId') friendId: string) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(await this.friendService.statusFriend(user, friendId));
    } catch (error) {
      throw error;
    }
  }

  @Post('/add')
  async addFriend(@Req() req: Request, @Body('friendId') friendId: string) {
    try {
      const user = req.user as IUserCreated;
      const data = await this.friendService.addFriend(user, friendId);
      const { notify, ...responseData } = data;
      this.eventEmitter.emit('notify.received', { notify });
      return new Ok(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Delete('/:friendId')
  async deleteFriend(@Req() req: Request, @Param('friendId') friendId: string) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(await this.friendService.deleteFriend(user._id, friendId));
    } catch (error) {
      throw error;
    }
  }

  @Post('/confirm')
  async confirmFriend(@Req() req: Request, @Body('friendId') friendId: string) {
    try {
      const user = req.user as IUserCreated;
      const { friendData, notify } = await this.friendService.confirmFriend(
        user,
        friendId,
      );
      this.eventEmitter.emit('friend.confirm', notify);
      return new Ok(friendData);
    } catch (error) {
      throw error;
    }
  }

  @Post('/refuse')
  async refuseFriend(@Req() req: Request, @Body('friendId') friendId: string) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(await this.friendService.refuseFriend(user._id, friendId));
    } catch (error) {
      throw error;
    }
  }

  @Get('/mutual/:friendId')
  async getMutualFriends(
    @Req() req: Request,
    @Param('friendId') friendId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'name',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      return new Ok(
        await this.friendService.findMutualFriends(user, friendId, pagination),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/:userId')
  async getFriends(@Param('userId') userId: string) {
    try {
      return new Ok(await this.friendService.getFriends(userId));
    } catch (error) {
      throw error;
    }
  }

  @Get('/all/status/:userId')
  async getFriendOnlineAndOffline(
    @Req() req: Request,
    @Param('userId') userId: string,
  ) {
    try {
      const user = req.user as IUserCreated;
      if (user._id !== userId)
        throw new HttpException('Your not permission!', HttpStatus.BAD_REQUEST);
      return new Ok(await this.friendService.getFriendOnlineAndOffline(userId));
    } catch (error) {
      throw error;
    }
  }

  @Get('/search/status')
  async findFriendOnlineOfflineByName(
    @Req() req: Request,
    @Query('q') keyword: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'name',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      return new Ok(
        await this.friendService.findFriendOnlineOfflineByName(
          user,
          keyword.trim(),
          pagination,
        ),
      );
    } catch (error) {
      throw error;
    }
  }
}
