import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from '../../schema/user.model';
import { ChangeUsername, UserRegister } from '../auth.dto';
import { IUserCreated, Pagination } from '../../ultils/interface';
import { checkNegativeNumber, convertObjectId } from '../../ultils';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll() {
    return await this.userModel.find().lean();
  }

  async findById(userId: string): Promise<IUserCreated | null> {
    const objectId = new mongoose.Types.ObjectId(userId);
    return await this.userModel
      .findOne({ _id: objectId })
      .select({
        password: 0,
        __v: 0,
      })
      .lean();
  }

  async findByIdContainPassword(userId: string): Promise<IUserCreated | null> {
    const objectId = new mongoose.Types.ObjectId(userId);
    return await this.userModel.findOne({ _id: objectId }).lean();
  }

  async findByEmail(userEmail: string): Promise<IUserCreated | null> {
    return await this.userModel.findOne({ email: userEmail }).lean();
  }

  async findByUserName(keyword: string, pagination: Pagination) {
    const searchRegex = new RegExp(keyword, 'i');
    const { limit, page } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    const users = await this.userModel.aggregate([
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          avatarUrl: 1,
          isActive: 1,
          isLocked: 1,
        },
      },
      {
        $match: {
          isActive: true,
          isLocked: false,
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: searchRegex,
            },
          },
        },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);
    return {
      users,
      keyword,
    };
  }

  async activeUser(email: string) {
    return await this.userModel.findOneAndUpdate(
      { email },
      { isActive: true },
      { new: true },
    );
  }

  async changePassword(email: string, password: string) {
    return await this.userModel.findOneAndUpdate(
      { email },
      { password },
      { new: true },
    );
  }

  async changeEmail(user: IUserCreated, newEmail: string) {
    return await this.userModel.findOneAndUpdate(
      { _id: convertObjectId(user._id) },
      { email: newEmail },
      { new: true, upsert: true },
    );
  }

  async changeUsername(email: string, updated: ChangeUsername) {
    return await this.userModel.findOneAndUpdate(
      { email },
      { updated },
      { new: true },
    );
  }

  async changeUserAvatar(userId: string, avatarUrl: string) {
    return await this.userModel.findOneAndUpdate(
      { _id: convertObjectId(userId) },
      { avatarUrl },
      { new: true },
    );
  }

  async create(data: UserRegister) {
    const peerId = uuidv4();
    return await this.userModel.create({ ...data, peer: peerId });
  }

  async updateAll() {
    return await this.userModel.updateMany({
      friends: 0,
      viewer: 0,
      total_post: 0,
      job: 'Student',
      address: 'Viet Nam',
      social_github: 'default',
      social_facebook: 'default',
    });
  }

  async lockedAccount(user: IUserCreated) {
    return await this.userModel.findOneAndUpdate(
      {
        _id: user._id,
        isLocked: false,
      },
      {
        isLocked: true,
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  async unLockedAccount(user: IUserCreated) {
    return await this.userModel.findOneAndUpdate(
      {
        _id: user._id,
        isLocked: true,
      },
      {
        isLocked: false,
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  async updateUserName(userId: string, firstName: string, lastName: string) {
    return await this.userModel.findOneAndUpdate(
      {
        _id: convertObjectId(userId),
      },
      {
        firstName: firstName,
        lastName: lastName,
      },
    );
  }

  async fixBug() {
    return await this.userModel.updateMany({
      isLocked: false,
    });
  }

  async findUserFromIds(ids: string[]) {
    return await this.userModel
      .find({
        _id: {
          $in: ids,
        },
      })
      .select({
        _id: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        userName: { $concat: ['$firstName', ' ', '$lastName'] },
      });
  }

  async updatePeerId(userId: string, peerId: string) {
    return await this.userModel.findOneAndUpdate(
      {
        _id: convertObjectId(userId),
      },
      {
        peer: peerId,
      },
    );
  }
}
