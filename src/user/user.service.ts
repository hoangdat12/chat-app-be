import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuthRepository } from '../auth/repository/auth.repository';
import { ChangeUsername } from '../auth/auth.dto';
import { Ok } from '../ultils/response';
import { ConversationRepository } from '../conversation/conversation.repository';
import { IUserCreated, Pagination } from '../ultils/interface';
import { v4 as uuidv4 } from 'uuid';
import { IGatewaySessionManager } from '../gateway/gateway.sesstion';
import { Services } from 'src/ultils/constant';

@Injectable()
export class UserService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly conversationRepository: ConversationRepository,
    @Inject(Services.GATEWAY_SESSION_MANAGER)
    private readonly socketSession: IGatewaySessionManager,
  ) {}

  async getAllUser() {
    const users = await this.authRepository.findAll();
    return new Ok<any>(users, 'success');
  }

  async searchUser(keyword: string, pagination: Pagination) {
    return await this.authRepository.findByUserName(keyword.trim(), pagination);
  }

  async changeUserName(user: IUserCreated, data: ChangeUsername) {
    const email = user.email;
    await this.checkUserExist(email);

    const userUpdate = this.authRepository.changeUsername(email, data);
    if (!userUpdate)
      throw new HttpException('DB error!', HttpStatus.INTERNAL_SERVER_ERROR);

    return new Ok<string>('Change username success!', 'Success');
  }

  async getConversation(user: IUserCreated, pagination: Pagination) {
    return await this.conversationRepository.findConversationOfUser(
      user._id.toString(),
      pagination,
    );
  }

  async changeUserAvatar(userId: string, avatarUrl: string) {
    const userUpdate = await this.authRepository.changeUserAvatar(
      userId,
      avatarUrl,
    );

    if (!userUpdate)
      throw new HttpException('DB error!', HttpStatus.INTERNAL_SERVER_ERROR);

    return avatarUrl;
  }

  async checkUserExist(email: string) {
    const userExist = await this.authRepository.findByEmail(email);
    if (!userExist)
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);
    return userExist;
  }

  async findUserByEmail(email: string) {
    const user = await this.authRepository.findByEmail(email);
    delete user.password;
    return { user };
  }

  async checkUserOnline(userId: string) {
    const found = this.socketSession.getUserSocket(userId);
    if (found) return { isOnline: true };
    else return { isOnline: false };
  }

  async fixBug() {
    const users = await this.authRepository.findAll();
    for (let user of users) {
      const peerId = uuidv4();
      await this.authRepository.updatePeerId(user._id.toString(), peerId);
    }
  }
}
