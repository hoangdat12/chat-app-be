import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthRepository } from '../repository/auth.repository';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authRepository: AuthRepository) {
    super();
  }

  serializeUser(user: any, done: Function) {
    done(null, user);
  }

  async deserializeUser(payload: any, done: Function) {
    const user = await this.authRepository.findByEmail(payload.email);
    return user ? done(null, user) : done(null, null);
  }
}
