import { Global, Module, forwardRef } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationRepository } from './conversation.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel } from '../schema/conversation.model';
import { MessageModule } from '../message/message.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([ConversationModel]),
    forwardRef(() => MessageModule),
    CloudinaryModule,
  ],
  providers: [ConversationService, ConversationRepository],
  controllers: [ConversationController],
  exports: [ConversationRepository, ConversationService],
})
export class ConversationModule {}
