import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITGUB_SECRET_ID,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['public_profile'],
    });
  }

  async validate(accessToken: string, _refreshToken: string, profile: Profile) {
    const { username, photos } = profile;
    const data = {
      email: `${username}@gmail.com`,
      firstName: null,
      lastName: username,
      avatarUrl: photos[0].value,
      loginWith: 'github',
    };
    const user = await this.authService.handleLoginWithOauth2(data);
    return user;
  }
}
