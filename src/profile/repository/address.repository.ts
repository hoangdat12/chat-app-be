import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { convertObjectId } from '../../ultils';
import { Address } from '../../schema/address.model';

@Injectable()
export class AddressRepository {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>,
  ) {}

  async findByUserId(userId: string) {
    return await this.addressModel.findOne({
      address_user: convertObjectId(userId),
    });
  }

  async create(userId: string) {
    return await this.addressModel.create({
      address_user: convertObjectId(userId),
    });
  }
}
