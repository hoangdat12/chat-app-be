import { Module, forwardRef } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesModel } from '../schema/message.model';
import { MessageRepository } from './message.repository';
import { ConversationModule } from '../conversation/conversation.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
@Module({
  imports: [
    MongooseModule.forFeature([MessagesModel]),
    forwardRef(() => ConversationModule),
    CloudinaryModule,
  ],
  providers: [MessageService, MessageRepository],
  controllers: [MessageController],
  exports: [MessageRepository],
})
export class MessageModule {}
