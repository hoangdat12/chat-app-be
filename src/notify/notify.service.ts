import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { NotifyRepository } from './notify.repository';
import { IUserCreated, Pagination } from '../ultils/interface';
import {
  INotifyLink,
  INotifyPost,
  UserNotify,
} from 'src/ultils/interface/notify.interface';
import { AuthRepository } from '../auth/repository/auth.repository';
import { NotifyType } from '../ultils/constant/notify.constant';
import { DataCreateNotify } from './notify.dto';
import { getContentNotify, getNotifyLink } from '../ultils';

@Injectable()
export class NotifyService {
  constructor(
    private readonly notifyRepository: NotifyRepository,
    private readonly userRepository: AuthRepository,
  ) {}

  async createNotify(user: UserNotify, data: DataCreateNotify) {
    const {
      notifyType,
      ownerNotify,
      notifyLink,
      post = null,
      notify_friend = null,
    } = data;

    const foundUser = await this.userRepository.findById(user.userId);
    if (!foundUser)
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);

    const notify_content = getContentNotify(user, notifyType, post);
    const notify_link = getNotifyLink(notifyLink, notifyType);

    const payload = {
      user_id: ownerNotify.userId,
      notify_type: notifyType,
      notify_friend,
      notify_link,
      notify_content,
      notify_image: user.avatarUrl,
    };
    const newNotify = await this.notifyRepository.create(payload);
    if (!newNotify)
      throw new HttpException(
        'Server Error!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    else return newNotify;
  }

  async deleteNotify(userId: string, notifyId: string) {
    const foundNotify = await this.notifyRepository.notifyExist(
      userId,
      notifyId,
    );
    if (!foundNotify)
      throw new HttpException('Notify not found!', HttpStatus.NOT_FOUND);

    return await this.notifyRepository.deleteNotify(userId, notifyId);
  }

  async deleteNotifyAddFriend(userId: string, friendId: string) {
    const notify = await this.notifyRepository.findNotifyAddFriend(
      userId,
      friendId,
    );
    const data = await this.notifyRepository.deleteNotifyAddFriend(
      userId,
      friendId,
    );
    if (!data)
      throw new HttpException('DB Error!', HttpStatus.INTERNAL_SERVER_ERROR);
    else return notify;
  }

  async getNotify(user: IUserCreated, pagination: Pagination) {
    const notifies = await this.notifyRepository.findNotify(user, pagination);
    let unRead = 0;
    for (let notify of notifies.slice(0, 6)) {
      if (notify.notify_readed) break;
      else unRead++;
    }
    return { unRead, notifies };
  }

  async readNotify(user: IUserCreated, notifyId: string) {
    return await this.notifyRepository.readNotify(user, notifyId);
  }
}
