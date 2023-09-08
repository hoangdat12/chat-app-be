import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ChangeUsername } from '../auth/auth.dto';
import { Ok } from '../ultils/response';
import { IUserCreated } from '../ultils/interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  async getAllUser() {
    try {
      return await this.userService.getAllUser();
    } catch (err) {
      throw err;
    }
  }

  @Get('/search')
  async searchUserByName(
    @Query('q') keyword: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'name',
  ) {
    try {
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const pagination = {
        page: parsedPage,
        limit: parsedLimit,
        sortBy,
      };
      return new Ok(await this.userService.searchUser(keyword, pagination));
    } catch (err) {
      throw err;
    }
  }

  @Patch('change-username')
  async changeUsername(@Req() req: Request, @Body() data: ChangeUsername) {
    try {
      const user = req.user as IUserCreated;
      return await this.userService.changeUserName(user, data);
    } catch (err) {
      throw err;
    }
  }

  @Patch('change-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async changeAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      const user = req.user as IUserCreated;
      const image = await this.cloudinaryService.uploadFile(file);
      const avatarUrl = image.url;

      return new Ok(
        await this.userService.changeUserAvatar(user._id, avatarUrl),
      );
    } catch (err) {
      throw err;
    }
  }

  @Get('/conversation/:userId')
  async getConversationOfUser(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    const user = req.user as IUserCreated;
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: sortBy,
    };
    const conversations = await this.userService.getConversation(
      user,
      pagination,
    );
    const data = {
      conversations,
      page,
      limit,
      sortBy,
    };
    return new Ok<any>(data, 'success!');
  }

  @Post('/email')
  async findUserByEmail(@Body('email') email: string) {
    try {
      return new Ok(await this.userService.findUserByEmail(email));
    } catch (err) {
      throw err;
    }
  }

  @Get('/status/:userId')
  async checkStatusUser(@Param('userId') userId: string) {
    try {
      return new Ok(await this.userService.checkUserOnline(userId));
    } catch (err) {
      throw err;
    }
  }

  @Get('/bug/fix')
  async fixBug(@Req() req: Request) {
    return await this.userService.fixBug();
  }
}
