import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  CreateMessageData,
  DelelteMessageData,
  UpdateMessageData,
} from './message.dto';
import { MessageService } from './message.service';
import { Request } from 'express';
import { Ok } from '../ultils/response';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserCreated } from '../ultils/interface';
import { validate } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly evenEmiter: EventEmitter2,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  async createMessage(@Req() req: Request, @Body() body: CreateMessageData) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const newMessage = await this.messageService.createMessage(user, body);
      this.evenEmiter.emit('message.create', newMessage);
      return new Ok<any>(newMessage);
    } catch (err) {
      throw err;
    }
  }

  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  async createMessageImage(
    @Req() req: Request,
    @Body('body') body: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const data = JSON.parse(body) as CreateMessageData;
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const image = await this.cloudinaryService.uploadFile(file);
      data.message_content = image.url;
      const newMessage = await this.messageService.createMessage(user, data);
      this.evenEmiter.emit('message.create', newMessage);
      return new Ok<any>(newMessage);
    } catch (err) {
      throw err;
    }
  }

  @Patch()
  async updateMessage(@Req() req: Request, @Body() body: UpdateMessageData) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const messageUpdate = await this.messageService.update(user, body);
      this.evenEmiter.emit('message.update', messageUpdate);
      return new Ok(messageUpdate);
    } catch (err) {
      throw err;
    }
  }

  @Delete()
  async deleteMessage(@Req() req: Request, @Body() body: DelelteMessageData) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const messageDelete = await this.messageService.delete(user, body);
      this.evenEmiter.emit('message.delete', messageDelete);
      return new Ok(messageDelete);
    } catch (err) {
      throw err;
    }
  }

  @Get('/image/:conversationId')
  async getMessageImageOfConversation(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
  ) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(
        await this.messageService.getImageOfConversation(
          user._id,
          conversationId,
        ),
      );
    } catch (err) {
      throw err;
    }
  }
}
