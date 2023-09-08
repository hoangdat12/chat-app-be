import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConversationModule } from '../conversation/conversation.module';
import { RedisModule } from '../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [ConversationModule, RedisModule, GatewayModule, CloudinaryModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
