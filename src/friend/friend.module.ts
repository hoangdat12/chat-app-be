import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendRepository } from './repository/friend.repository';
import { NotifyModule } from '../notify/notify.module';
import { RedisModule } from '../redis/redis.module';
import { ProfileModule } from '../profile/profile.module';
import { FriendRequestModel } from '../schema/friend.request.model';
import { FriendRequestRepository } from './repository/friend.request.repository';
import { FriendModel } from '../schema/friend.model';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([FriendModel, FriendRequestModel]),
    NotifyModule,
    RedisModule,
    ProfileModule,
    GatewayModule,
  ],
  controllers: [FriendController],
  providers: [FriendService, FriendRepository, FriendRequestRepository],
  exports: [FriendService],
})
export class FriendModule {}
