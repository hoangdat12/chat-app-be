import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Request } from 'express';
import { IUserCreated } from '../ultils/interface';
import { Ok } from '../ultils/response';
import { validate } from 'class-validator';
import {
  DataUpdateAddress,
  DataUpdateInformationUser,
  IDataChangeSocialLink,
} from './profile.dto';
import { isObjectId } from '../ultils';

@Controller('/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('/:userId')
  async viewProfile(@Req() req: Request, @Param('userId') userId: string) {
    try {
      isObjectId(userId);
      const user = req.user as IUserCreated;
      return new Ok(await this.profileService.viewProfile(user, userId));
    } catch (error) {
      throw error;
    }
  }

  @Patch('/update/social-link')
  async updateSocialLink(
    @Req() req: Request,
    @Body() data: IDataChangeSocialLink,
  ) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return new Ok(await this.profileService.updateSocialLink(user, data));
    } catch (err) {
      throw err;
    }
  }

  @Patch('/update/user-information')
  async changeUserInformation(
    @Req() req: Request,
    @Body() data: DataUpdateInformationUser,
  ) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return new Ok(
        await this.profileService.changeUserInformation(user, data),
      );
    } catch (err) {
      throw err;
    }
  }

  @Patch('/update/user-address')
  async updateInformation(@Req() req: Request, @Body() data: DataUpdateAddress) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return new Ok(await this.profileService.updateAddress(user, data));
    } catch (err) {
      throw err;
    }
  }

  @Get('/bug/fix')
  async fixBug() {
    return await this.profileService.createProfileFixBug();
  }
}
