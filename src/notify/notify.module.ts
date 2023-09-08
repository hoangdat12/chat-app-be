import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotifyModel } from '../schema/notify.model';
import { NotifyController } from './notify.controller';
import { NotifyService } from './notify.service';
import { NotifyRepository } from './notify.repository';

@Module({
  imports: [MongooseModule.forFeature([NotifyModel])],
  controllers: [NotifyController],
  providers: [NotifyService, NotifyRepository],
  exports: [NotifyService],
})
export class NotifyModule {}
