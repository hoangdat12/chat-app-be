import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtMiddleWare implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: any, res: any, next: (error?: any) => void) {
    try {
      return await this.jwtService.verifyAccessToken(req, next);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
}
