import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostModel } from '../schema/post.model';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';
import { RedisModule } from '../redis/redis.module';
import { ProfileModule } from '../profile/profile.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [
    MongooseModule.forFeature([PostModel]),
    RedisModule,
    ProfileModule,
    CloudinaryModule,
    NotifyModule
  ],
  providers: [PostService, PostRepository],
  controllers: [PostController],
  exports: [PostRepository],
})
export class PostModule {}
