import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { Request } from 'express';
import { IUserCreated } from '../ultils/interface';
import {
  IDataChangeUsernameOfParticipant,
  ChangeTopic,
  PayloadAddPaticipant,
  PayloadCreateConversation,
  PayloadDeletePaticipant,
  ReadLastMessage,
  RenameGroup,
  ChangeEmoji,
} from './conversation.dto';
import { validate } from 'class-validator';
import { Ok } from '../ultils/response';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageType } from '../ultils/constant';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('conversation')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly eventEmiter: EventEmitter2,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  async createConversation(
    @Req() req: Request,
    @Body() body: PayloadCreateConversation,
  ) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const { conversation, lastMessage } =
        await this.conversationService.createConversation(user, body);
      if (conversation.conversation_type === MessageType.GROUP) {
        this.eventEmiter.emit('conversation.create', {
          conversation,
          lastMessage,
        });
      }
      return new Ok(conversation);
    } catch (err) {
      throw err;
    }
  }

  @Get('search')
  async findConversationByName(
    @Req() req: Request,
    @Query('q') keyword: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      return new Ok(
        await this.conversationService.findByName(user, keyword, pagination),
      );
    } catch (err) {
      throw err;
    }
  }

  @Get('/first')
  async getFirstConversation(@Req() req: Request) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(await this.conversationService.getFirstConversation(user));
    } catch (err) {
      throw err;
    }
  }

  @Get('/:conversationId')
  async getMessageOfConversation(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('sortBy') sortBy: string = 'ctime',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sortBy,
      };
      const response = await this.conversationService.getMessageOfConversation(
        user,
        { conversationId },
        pagination,
      );
      return new Ok(response);
    } catch (err) {
      throw err;
    }
  }
  /**
   * Delete conversation but still join in conversation
   */
  @Delete('/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as IUserCreated;
      return await this.conversationService.deleteConversation(user, {
        conversationId,
      });
    } catch (err) {
      throw err;
    }
  }

  @Patch('/group/participant/delele')
  async deletePaticipantOfConversation(
    @Req() req: Request,
    @Body() body: PayloadDeletePaticipant,
  ) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const responseData =
        await this.conversationService.deletePaticipantOfConversation(
          user,
          body,
        );
      this.eventEmiter.emit('conversaiton.participant.delete', responseData);
      return new Ok('Delete user from group successfully!');
    } catch (err) {
      throw err;
    }
  }

  @Patch('/group/participant/leave/:conversationId')
  async leaveConversation(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
  ) {
    try {
      const user = req.user as IUserCreated;
      const responseData = await this.conversationService.leaveConversation(
        user,
        conversationId,
      );
      this.eventEmiter.emit('conversaiton.participant.leave', responseData);
      return new Ok('Leave group successfully!');
    } catch (err) {
      throw err;
    }
  }

  @Patch('/group/participant/promoted')
  async promotedAminGroup(
    @Req() req: Request,
    @Body() body: PayloadDeletePaticipant,
  ) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const responseData = await this.conversationService.promotedAminGroup(
        user,
        body,
      );
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Post('/group/participant/add')
  async addPaticipantOfConversation(
    @Req() req: Request,
    @Body() body: PayloadAddPaticipant,
  ) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const { conversation, newMember, lastMessage } =
        await this.conversationService.addPaticipantOfConversation(user, body);
      if (lastMessage) {
        this.eventEmiter.emit('conversaiton.participant.add', {
          conversation,
          newMember,
          lastMessage,
        });
      }
      return new Ok({
        conversationId: conversation._id,
        newMember,
        lastMessage,
      });
    } catch (err) {
      throw err;
    }
  }

  @Patch('/change-username')
  async setNicknameOfParticipant(
    @Req() req: Request,
    @Body() body: IDataChangeUsernameOfParticipant,
  ) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const updated = await this.conversationService.changeUsernameOfUser(
        user,
        body,
      );
      this.eventEmiter.emit('conversation.changeUsername', updated);
      return new Ok(updated.newUsernameOfParticipant);
    } catch (err) {
      throw err;
    }
  }

  @Patch('/change-topic')
  async changeTopicOfConversation(
    @Req() req: Request,
    @Body() body: ChangeTopic,
  ) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return new Ok(
        await this.conversationService.changeTopicOfConversation(user, body),
      );
    } catch (err) {
      throw err;
    }
  }

  @Patch('/change-name-group')
  async renameGroup(@Req() req: Request, @Body() data: RenameGroup) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const responseData = await this.conversationService.renameGroup(
        user,
        data,
      );
      this.eventEmiter.emit('conversation.changeNameGroup', responseData);
      return new Ok(responseData.conversation);
    } catch (err) {
      throw err;
    }
  }

  @Patch('/change-avatar-group')
  @UseInterceptors(FileInterceptor('file'))
  async changeAvatarGroup(
    @Req() req: Request,
    @Body('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const user = req.user as IUserCreated;
      const image = await this.cloudinaryService.uploadFile(file);
      const responseData = await this.conversationService.changeAvatarGroup(
        user,
        conversationId,
        image.url,
      );
      this.eventEmiter.emit('conversation.changeAvatarGroup', {
        user,
        conversation: responseData,
      });
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Post('/read-last-message')
  async readLastMessage(@Req() req: Request, @Body() data: ReadLastMessage) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return new Ok(
        await this.conversationService.readLastMessage(
          user,
          data.conversationId,
        ),
      );
    } catch (err) {
      throw err;
    }
  }

  @Patch('/change-emoji')
  async changeEmoji(@Req() req: Request, @Body() data: ChangeEmoji) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const responseData = await this.conversationService.changeEmoji(
        user,
        data,
      );
      this.eventEmiter.emit('conversation.changeEmoji', {
        user,
        conversation: responseData,
      });
      return new Ok(responseData);
    } catch (err) {
      throw err;
    }
  }

  @Get('/match/:matchId')
  async getMatchConversation(
    @Req() req: Request,
    @Param('matchId') matchId: string,
  ) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(
        await this.conversationService.getMatchConversation(user._id, matchId),
      );
    } catch (error) {
      throw error;
    }
  }

  @Post('/change/notification/:conversationId')
  async changeNotification(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
  ) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(
        await this.conversationService.changeNotification(
          user._id,
          conversationId,
        ),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/group/:userId')
  async getGroups(@Req() req: Request, @Param('userId') userId: string) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(
        await this.conversationService.getGroupOfUser(user, userId),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/group/search/:userId')
  async findGroupByKeyword(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query('search') keyword: string,
  ) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(
        await this.conversationService.handleSearchGroup(user, userId, keyword),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('/bug/fix')
  async fixBug() {
    return await this.conversationService.fixBug();
  }
}
