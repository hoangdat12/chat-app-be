import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '../redis/redis.module';
import { ProfileModel } from '../schema/profile.model';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './repository/profile.repository';
import { ProfileController } from './profile.controller';
import { AddressModel } from '../schema/address.model';
import { AddressRepository } from './repository/address.repository';

@Module({
  imports: [
    MongooseModule.forFeature([ProfileModel, AddressModel]),
    RedisModule,
  ],
  providers: [ProfileService, ProfileRepository, AddressRepository],
  controllers: [ProfileController],
  exports: [ProfileService, ProfileRepository],
})
export class ProfileModule {}
