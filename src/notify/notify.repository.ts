import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notify } from '../schema/notify.model';
import { Model } from 'mongoose';
import { IDataCreateNotify } from '../ultils/interface/notify.interface';
import { IUserCreated, Pagination } from '../ultils/interface';
import { checkNegativeNumber } from '../ultils';
import { NotifyType } from '../ultils/constant';

@Injectable()
export class NotifyRepository {
  constructor(
    @InjectModel(Notify.name)
    private readonly notifyModel: Model<Notify>,
  ) {}

  async create(data: IDataCreateNotify) {
    return await this.notifyModel.create(data);
  }

  async notifyExist(userId: string, notifyId: string) {
    return await this.notifyModel.findOne({
      user_id: userId,
      _id: notifyId,
    });
  }

  async deleteNotify(userId: string, notifyId: string) {
    return await this.notifyModel.deleteOne({
      user_id: userId,
      _id: notifyId,
    });
  }

  async deleteNotifyAddFriend(userId: string, friendId: string) {
    return await this.notifyModel.deleteOne({
      user_id: userId,
      'notify_friend._id': friendId,
      notify_type: NotifyType.ADD_FRIEND,
    });
  }

  async findNotifyAddFriend(userId: string, friendId: string) {
    return await this.notifyModel.findOne({
      user_id: userId,
      'notify_friend._id': friendId,
    });
  }

  async findNotify(user: IUserCreated, pagination: Pagination) {
    const { limit, page, sortBy } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    const notifies = await this.notifyModel
      .find({
        user_id: user._id,
      })
      .lean()
      .sort(sortBy === 'ctime' ? { createdAt: -1 } : { createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
    return notifies;
  }

  async readNotify(user: IUserCreated, notifyId: string) {
    return await this.notifyModel.findOneAndUpdate(
      {
        user_id: user._id,
        _id: notifyId,
      },
      {
        notify_readed: true,
      },
      {
        new: true,
        upsert: true,
      },
    );
  }
}
