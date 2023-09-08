import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TimeExpires, Headers } from '../ultils/constant';
import { NextFunction, Request } from 'express';
import { AuthRepository } from '../auth/repository/auth.repository';
import { KeyTokenRepository } from '../auth/repository/keyToken.repository';
import { KeyToken } from '../schema/keyToken.model';
import { Ok } from '../ultils/response';

export interface PayloadToken {
  id: string;
  email: string;
}

// export interface MyRequest extends Request {
//   keyToken: KeyToken
// }

@Injectable()
export class JwtService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly keyTokenRepository: KeyTokenRepository,
  ) {}

  signAccessToken(payload: PayloadToken, privateKey: string) {
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: TimeExpires.ACCESS_TIME_EXPIRE,
    });
  }

  signRefreshToekn(payload: PayloadToken, privateKey: string) {
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: TimeExpires.REFRESH_TIME_EXPIRE,
    });
  }

  createTokenPair(payload: PayloadToken, privateKey: string) {
    const { id, email } = payload;
    const accessToken = this.signAccessToken({ id, email }, privateKey);
    const refreshToken = this.signRefreshToekn({ id, email }, privateKey);
    return { accessToken, refreshToken };
  }

  async verifyAccessToken(req: Request, next: NextFunction) {
    try {
      const clientId = req.headers[Headers.CLIENT_ID] as string;
      const header = req.headers[Headers.AUTHORIZATION] as string;
      if (!clientId || !header)
        throw new HttpException(
          'Missing request header!',
          HttpStatus.BAD_REQUEST,
        );
      const user = await this.authRepository.findById(clientId);
      if (!user)
        throw new HttpException('User not found!', HttpStatus.NOT_FOUND);

      const keyToken = await this.keyTokenRepository.findByUserId(clientId);
      if (!keyToken)
        throw new HttpException('User not found!', HttpStatus.NOT_FOUND);
      const token = header.substring(7);
      const decoded = this.decodeToken(token, keyToken.publicKey);
      if (!decoded || clientId != decoded.id)
        throw new HttpException('Invalid Token!', HttpStatus.UNAUTHORIZED);

      delete user.password;

      // req.keyToken = keyToken;
      user._id = user._id.toString();
      req.user = user;

      next();
    } catch (err) {
      console.log(err);
      throw new HttpException('Server Error!', HttpStatus.FORBIDDEN);
    }
  }

  async refreshToken(req: Request) {
    const clientId = req.headers[Headers.CLIENT_ID] as string;
    if (!clientId)
      throw new HttpException(
        'Missing request header!',
        HttpStatus.BAD_REQUEST,
      );
    const token = req.headers[Headers.REFRESH_TOKEN] as string;
    // const token = req.cookies[Headers.COOKIE_REFRESH_TOKEN];
    if (!token)
      throw new HttpException('Un Authorization', HttpStatus.NOT_FOUND);
    const user = await this.authRepository.findById(clientId);
    if (!user) throw new HttpException('User not found!', HttpStatus.NOT_FOUND);

    const refreshTokenUsed =
      await this.keyTokenRepository.findByRefreshTokenUsed(token);

    let decoded = null;

    if (refreshTokenUsed) {
      decoded = this.decodeToken(token, refreshTokenUsed.publicKey);
      console.log(`User using this refreshToken is ${decoded.email}`);

      await this.keyTokenRepository.deleteByUserId(decoded.id);

      return {
        refreshToken: null,
        response: new Ok<string>(
          'Something went wrong, please reLogin to continue using!',
        ),
      };
    } else {
      const keyToken = await this.keyTokenRepository.findByRefreshToken(token);
      if (!keyToken)
        throw new HttpException('Un Authorization', HttpStatus.UNAUTHORIZED);
      decoded = this.decodeToken(token, keyToken.publicKey);
      if (decoded.id !== clientId)
        throw new HttpException('Un Authorization', HttpStatus.UNAUTHORIZED);

      const { refreshToken, accessToken } = this.createTokenPair(
        decoded,
        keyToken.privateKey,
      );
      await this.keyTokenRepository.update(token, refreshToken);

      return {
        refreshToken,
        accessToken,
      };
    }
  }

  decodeToken(token: string, publicKey: any) {
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'], // fix the typo here
    });
  }
}
