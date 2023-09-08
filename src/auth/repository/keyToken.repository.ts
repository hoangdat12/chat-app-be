import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { KeyToken } from '../../schema/keyToken.model';
import { Model } from 'mongoose';
import { KeyTokenCreate } from '../../ultils/interface';

@Injectable()
export class KeyTokenRepository {
  constructor(
    @InjectModel(KeyToken.name) private keyTokenModel: Model<KeyToken>,
  ) {}

  async findById(id: string): Promise<KeyToken> {
    return await this.keyTokenModel.findById(id).lean();
  }

  async findByUserId(userId: string): Promise<KeyToken> {
    return await this.keyTokenModel.findOne({ user: userId }).lean();
  }

  async findByRefreshToken(refreshToken: string) {
    return await this.keyTokenModel.findOne({ refreshToken }).lean();
  }

  async findByRefreshTokenUsed(refreshToken: string) {
    const isExist = await this.keyTokenModel
      .findOne({ refreshTokenUsed: refreshToken })
      .lean();
    return isExist;
  }

  async deleteByUserId(userId: string) {
    return await this.keyTokenModel.deleteOne({
      user: userId,
    });
  }

  async createKeyToken(data: KeyTokenCreate): Promise<void> {
    const token = await this.keyTokenModel.findOneAndUpdate(
      { user: data.user._id },
      { ...data, refreshTokenUsed: [] },
      { new: true, upsert: true },
    );
    if (!token)
      throw new HttpException('DB error!', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  async update(olderRefreshToken: string, newRefreshToken: string) {
    return await this.keyTokenModel.findOneAndUpdate(
      {
        refreshToken: olderRefreshToken,
      },
      {
        refreshTokenUsed: {
          $push: { olderRefreshToken },
        },
        refreshToken: newRefreshToken,
      },
      {
        new: true,
      },
    );
  }
}
