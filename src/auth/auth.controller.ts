import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UseGuards,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePassword,
  ForgotPassword,
  UserLogin,
  UserRegister,
} from './auth.dto';
import { Response, Request } from 'express';
import { GoogleAuthGuard } from './google/google.guard';
import { GitHubAuthGuard } from './github/github.guard';
import { JwtService } from '../jwt/jwt.service';
import { IUserCreated } from '../ultils/interface';
import { validate } from 'class-validator';
import { Ok } from '../ultils/response';
import { OtpType } from '../ultils/constant';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() body: UserRegister) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      return await this.authService.register(body);
    } catch (err) {
      throw err;
    }
  }

  @Get('active/:token')
  async activeAccount(@Param('token') token: string, @Res() res: Response) {
    try {
      const { isValid, user } = await this.authService.activeAccount(token);
      if (isValid) {
        return res.redirect('http://localhost:5173/login');
      } else {
        return res.redirect('http://localhost:5173/error');
      }
    } catch (err) {
      throw err;
    }
  }

  @Post('login')
  async login(@Body() body: UserLogin, @Res() res: Response) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const { refreshToken, response } = await this.authService.login(body);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 15,
      });
      return response.sender(res);
    } catch (err) {
      throw err;
    }
  }

  @Get('login/google')
  @UseGuards(GoogleAuthGuard)
  async loginWithGoogle() {
    try {
      return { msg: 'Ok' };
    } catch (err) {
      throw err;
    }
  }

  @Get('login/google/redirect')
  @UseGuards(GoogleAuthGuard)
  async loginWithGoogleRedirect(@Res() res: Response) {
    return res.redirect('http://localhost:5173/login/success');
  }

  @Get('login/github')
  @UseGuards(GitHubAuthGuard)
  async loginWithGithub() {
    try {
      return { msg: 'Ok' };
    } catch (err) {
      throw err;
    }
  }

  @Get('login/github/redirect')
  @UseGuards(GitHubAuthGuard)
  async loginWithGithubRedirect(@Res() res: Response) {
    return res.redirect('http://localhost:5173/login/success');
  }

  @Get('status')
  async getUser(@Res() res: Response, @Req() req: Request) {
    try {
      if (req.user) {
        const user = req.user as IUserCreated;
        const { refreshToken, response } =
          await this.authService.loginWithOauth2(user.email);
        return response.sender(res);
      } else {
        return res
          .status(HttpStatus.FORBIDDEN)
          .json({ msg: 'Un Authorization!' });
      }
    } catch (err) {
      throw err;
    }
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const { refreshToken, accessToken } = await this.jwtService.refreshToken(
        req,
      );
      // res.cookie('refreshToken', refreshToken, {
      //   httpOnly: true,
      //   maxAge: 129600000,
      // });
      return new Ok({ refreshToken, token: accessToken }).sender(res);
    } catch (err) {
      throw err;
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      return (await this.authService.logout(req)).sender(res);
    } catch (err) {
      throw err;
    }
  }

  @Post('verify-email/change/password')
  async verifyEmailGetPassword(@Body('email') email: string) {
    try {
      if (!email) throw new Error('Missing value!');
      return await this.authService.verifyEmail(email, OtpType.PASSWORD);
    } catch (err) {
      throw err;
    }
  }

  @Post('verify-email/change/email')
  async verifyEmailChangeEmail(@Req() req: Request) {
    try {
      const user = req.user as IUserCreated;
      return await this.authService.verifyEmail(user.email, OtpType.EMAIL);
    } catch (err) {
      throw err;
    }
  }

  @Post('verify-password')
  async verifyPassword(@Req() req: Request, @Body() body: UserLogin) {
    try {
      const errors = await validate(body);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      if (user.email !== body.email) throw new Error('Invalid value!');
      return new Ok(await this.authService.verifyPassword(body));
    } catch (err) {
      throw err;
    }
  }

  @Get('verify-otp/:token')
  async verifyOtpToken(@Res() res: Response, @Param('token') token: string) {
    try {
      const foundOtp = await this.authService.verifyOtpToken(token);
      if (foundOtp) {
        res.cookie('secret', foundOtp.secret, {
          maxAge: 1000 * 60 * 15,
        });
        const redirectUrl =
          foundOtp.type === OtpType.EMAIL
            ? `http://localhost:5173/setting/security/change-email`
            : `http://localhost:5173/login/change-password`;

        return res.redirect(redirectUrl);
      } else return res.redirect(`http://localhost:5173/err`);
    } catch (err) {
      throw err;
    }
  }

  // Forgot password
  @Patch('get-password')
  async changPasswordWithSecret(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: ForgotPassword,
  ) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const secret = req.cookies['secret'];
      if (!secret) throw new Error('Invalid request!');
      const updated = await this.authService.changePasswordWithSecret(
        data,
        secret,
      );
      if (!updated) throw new Error('Server Error');
      res.cookie('secret', '', { expires: new Date(0) });
      return new Ok('Get password successfully!').sender(res);
    } catch (err) {
      throw err;
    }
  }

  // Change password
  @Patch('change-password')
  async changPassword(@Req() req: Request, @Body() data: ChangePassword) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      return await this.authService.changePassword(user, data);
    } catch (err) {
      throw err;
    }
  }

  @Patch('change-email')
  async changeEmail(
    @Req() req: Request,
    @Res() res: Response,
    @Body('email') email: string,
  ) {
    try {
      if (!email) throw new Error('Missing value!');
      const user = req.user as IUserCreated;
      const secret = req.cookies['secret'];
      if (!secret) throw new Error('Invalid request!');
      // clear cookie
      const updated = await this.authService.changeEmail(user, email, secret);
      if (!updated) throw new Error('Server Error');
      res.cookie('secret', '', { expires: new Date(0) });
      return new Ok(updated).sender(res);
    } catch (err) {
      throw err;
    }
  }

  @Post('locked-account')
  async lockedAccount(@Req() req: Request, @Body() data: UserLogin) {
    try {
      const errors = await validate(data);
      if (errors.length > 0) {
        throw new Error('Missing value!');
      }
      const user = req.user as IUserCreated;
      const updated = await this.authService.lockedAccount(user, data);
      if (!updated) throw new Error('Server Error');
      const res = new Ok('Locked Account successfully!');
      return res;
    } catch (err) {
      throw err;
    }
  }

  @Get('/bug/fix')
  async fixBug() {
    return await this.authService.fixBug();
  }
}
