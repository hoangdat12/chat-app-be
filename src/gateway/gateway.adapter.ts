import { IoAdapter } from '@nestjs/platform-socket.io';
import { AuthenticatedSocket } from './gateway.sesstion';
import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { KeyTokenRepository } from '../auth/repository/keyToken.repository';

@Injectable()
export class WebsocketAdapter extends IoAdapter {
  constructor(
    app: any,
    private readonly keyTokenRepository: KeyTokenRepository,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);

    server.use(async (socket: AuthenticatedSocket, next: any) => {
      const userJson = socket.handshake.headers['x-user'];
      const user = userJson ? JSON.parse(userJson as string) : null;
      if (!user) {
        console.log('Client has no login');
        return next(new Error('Not Authenticated!'));
      }
      const userLogin = await this.keyTokenRepository.findByUserId(user._id);
      if (!userLogin) {
        console.log('User not login!');
        return next('User not login!');
      }
      socket.user = user;
      next();
    });
    return server;
  }
}
