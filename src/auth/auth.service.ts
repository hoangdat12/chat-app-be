import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthRepository } from './repository/auth.repository';
import {
  ChangePassword,
  ForgotPassword,
  UserLogin,
  UserRegister,
} from './auth.dto';
import * as bcrypt from 'bcrypt';
import { Created, Ok } from '../ultils/response';
import * as crypto from 'crypto';
import { JwtService } from '../jwt/jwt.service';
import { KeyTokenRepository } from './repository/keyToken.repository';
import { Request } from 'express';
import { OtpTokenRepository } from './repository/otpToken.repository';
import { MailSenderService } from '../mail-sender/mail-sender.service';
import {
  activeAccountTemplate,
  confirmEmail,
  confirmEmailChangeEmail,
} from '../mail-sender/mail-sender.template';
import { ILoginWithGoogleData } from '../ultils/interface';
import { IUserCreated } from '../ultils/interface';
import { convertUserIdString, getUsername } from '../ultils';
import { OtpType } from '../ultils/constant';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly keyTokenRepository: KeyTokenRepository,
    private readonly otpTokenRepository: OtpTokenRepository,
    private readonly profileService: ProfileService,
    private readonly mailSender: MailSenderService,
  ) {}

  async register(data: UserRegister) {
    const { email, password } = data;
    const userExist = await this.authRepository.findByEmail(email);
    if (userExist)
      throw new HttpException('User already Eixst!', HttpStatus.CONFLICT);

    const hashPassword = bcrypt.hashSync(password, 10);

    const newUser = await this.authRepository.create({
      ...data,
      password: hashPassword,
    });

    if (!newUser)
      throw new HttpException(
        'User already Eixst!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const otpToken = await this.otpTokenRepository.createOtpToken(
      email,
      OtpType.ACCOUNT,
    );
    // Send mail
    const link = `http://localhost:8080/api/v1/auth/active/${otpToken?.token}`;
    const userName = `${newUser.firstName} ${newUser.lastName}`;
    const content = activeAccountTemplate(userName, link);
    // this.mailSender.sendEmailWithText(
    //   email,
    //   'Active your Account',
    //   content,
    // );

    return new Created<any>(
      {
        msg: `We send a email for account ${email}, please follow the guide to activate your account`,
        link: link,
      },
      'Register success!',
    );
  }

  async activeAccount(tokenActive: string) {
    if (!tokenActive)
      throw new HttpException('Missing value!', HttpStatus.BAD_REQUEST);

    const otpToken = await this.otpTokenRepository.findByToken(tokenActive);
    if (!otpToken) throw new HttpException('Not found', HttpStatus.NOT_FOUND);

    if (otpToken.type !== OtpType.ACCOUNT)
      throw new HttpException('Invalid!', HttpStatus.BAD_REQUEST);

    const userUpdate = await this.authRepository.activeUser(otpToken.email);
    if (!userUpdate) throw new HttpException('Not found', HttpStatus.NOT_FOUND);

    this.otpTokenRepository.deleteByToken(tokenActive);
    // Create Repository
    this.profileService.createProfile(userUpdate._id.toString());

    const user = convertUserIdString(userUpdate);
    return { isValid: true, user };
  }

  async login(data: UserLogin) {
    const { email, password } = data;
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw new HttpException('User not found!', HttpStatus.NOT_FOUND);
    if (user.loginWith !== 'email') {
      throw new HttpException(
        'User is already login with google!',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.isLocked) {
      // unLock account
      this.authRepository.unLockedAccount(user);
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword)
      throw new HttpException('Wrong password!', HttpStatus.NOT_FOUND);

    if (!user.isActive)
      throw new HttpException(
        'Accoutn is not active, please check email to active you account!',
        HttpStatus.BAD_REQUEST,
      );
    delete user.password;

    const { publicKey, privateKey } = this.generateKeyPair();
    const payload = {
      id: user._id,
      email: user.email,
    };
    const { accessToken, refreshToken } = this.jwtService.createTokenPair(
      payload,
      privateKey,
    );

    const dataKeyToken = {
      user: user,
      refreshToken,
      publicKey,
      privateKey,
    };
    await this.keyTokenRepository.createKeyToken(dataKeyToken);

    const metaData = {
      user: user,
      token: accessToken,
      refreshToken,
    };

    return {
      refreshToken,
      response: new Ok(metaData, 'Login success!'),
    };
  }

  async handleLoginWithOauth2(data: ILoginWithGoogleData) {
    const userExist = await this.authRepository.findByEmail(data.email);
    if (userExist) {
      delete userExist.password;
      return userExist;
    } else {
      const inforUser = {
        ...data,
        password: crypto.randomBytes(10).toString('hex'),
        isActive: true,
      };
      const newUser = await this.authRepository.create(inforUser);
      // Create Repository
      this.profileService.createProfile(newUser._id.toString());

      if (!newUser)
        throw new HttpException('DB error!', HttpStatus.INTERNAL_SERVER_ERROR);
      else return newUser;
    }
  }

  async loginWithOauth2(email: string) {
    const userExist = await this.authRepository.findByEmail(email);
    if (!userExist)
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);

    const { privateKey, publicKey } = this.generateKeyPair();

    const payload = {
      id: userExist._id,
      email: userExist.email,
    };

    delete userExist.password;
    const { accessToken, refreshToken } = this.jwtService.createTokenPair(
      payload,
      privateKey,
    );

    const dataKeyToken = {
      user: userExist,
      refreshToken,
      publicKey,
      privateKey,
    };

    await this.keyTokenRepository.createKeyToken(dataKeyToken);

    const metaData = {
      user: userExist,
      token: accessToken,
      refreshToken,
    };

    return {
      refreshToken,
      response: new Ok<any>(metaData, 'Login sucess!'),
    };
  }

  async logout(req: Request) {
    const user = req.user as IUserCreated;
    await this.keyTokenRepository.deleteByUserId(user._id);
    return new Ok<string>('Logout success!');
  }

  async verifyEmail(email: string, type: string) {
    const userExist = await this.authRepository.findByEmail(email);
    if (!userExist)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const foundOtp = await this.otpTokenRepository.findByEmail(email);
    if (foundOtp && foundOtp.type === type) {
      // delete otp
      this.otpTokenRepository.deleteByToken(foundOtp.token);
    }

    if (userExist.loginWith !== 'email') {
      return new Ok<string>(`Not valid!`, 'Error!');
    } else {
      const otpToken = await this.otpTokenRepository.createOtpToken(
        email,
        type,
      );
      console.log(otpToken);
      // Send mail
      const link = `http://localhost:8080/api/v1/auth/verify-otp/${otpToken.token}`;
      const userName = getUsername(userExist);
      let content: string = '';
      switch (type) {
        case 'email':
          content = confirmEmailChangeEmail(userName, link);
          break;
        case 'password':
          content = confirmEmail(userName, link);
          break;
        default:
          throw new HttpException('Type not valid', HttpStatus.BAD_REQUEST);
      }

      this.mailSender.sendEmailWithText(email, 'Verify Email', content);

      return new Ok<string>(
        `We send email ${email} an account activation link, please follow the instructions to activate your account`,
        'Success!',
      );
    }
  }

  async verifyPassword(data: UserLogin) {
    const { email, password } = data;

    const foundUser = await this.authRepository.findByEmail(email);
    if (!foundUser)
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);

    const validPassword = bcrypt.compareSync(password, foundUser.password);
    return { isValid: validPassword };
  }

  async verifyOtpToken(token: string) {
    return await this.otpTokenRepository.findByToken(token);
  }

  async changePasswordWithSecret(data: ForgotPassword, secret: string) {
    const otpToken = await this.otpTokenRepository.findBySecret(secret);
    if (!otpToken) throw new HttpException('Wrong!', HttpStatus.BAD_REQUEST);

    const userExist = await this.authRepository.findByEmail(otpToken.email);
    if (!userExist)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (otpToken.type !== OtpType.PASSWORD)
      throw new HttpException('Invalid!', HttpStatus.BAD_REQUEST);

    const matchPassword = data.newPassword === data.rePassword;
    if (!matchPassword)
      throw new HttpException('Wrong rePassword!', HttpStatus.BAD_REQUEST);

    const hashPassword = bcrypt.hashSync(data.newPassword, 10);
    const userChangePassoword = await this.authRepository.changePassword(
      otpToken.email,
      hashPassword,
    );
    if (!userChangePassoword)
      throw new HttpException('DB error!', HttpStatus.INTERNAL_SERVER_ERROR);

    // delete otp
    this.otpTokenRepository.deleteByToken(otpToken.token);

    return new Ok<string>('Change password success!', 'success');
  }

  async changePassword(user: IUserCreated, data: ChangePassword) {
    const foundUser = await this.authRepository.findByIdContainPassword(
      user._id,
    );
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (data.olderPassword === data.newPassword)
      throw new HttpException('Password unchanged!', HttpStatus.BAD_REQUEST);

    const matchPassword = data.newPassword === data.rePassword;
    if (!matchPassword)
      throw new HttpException('Wrong rePassword!', HttpStatus.BAD_REQUEST);

    const isValidPassword = bcrypt.compareSync(
      data.olderPassword,
      foundUser.password,
    );
    if (!isValidPassword)
      throw new HttpException('Wrong older Password!', HttpStatus.BAD_REQUEST);

    const hashPassword = bcrypt.hashSync(data.newPassword, 10);
    const userChangePassoword = await this.authRepository.changePassword(
      user.email,
      hashPassword,
    );
    if (!userChangePassoword)
      throw new HttpException('DB error!', HttpStatus.INTERNAL_SERVER_ERROR);

    return new Ok<string>('Change password successfully!', 'success');
  }

  async changeEmail(user: IUserCreated, newEmail: string, secret: string) {
    const otpToken = await this.otpTokenRepository.findBySecret(secret);
    if (
      !otpToken ||
      otpToken.type !== OtpType.EMAIL ||
      otpToken.email !== user.email
    )
      throw new HttpException('Invalid!', HttpStatus.BAD_REQUEST);

    const userExist = await this.authRepository.findByEmail(newEmail);
    if (userExist)
      throw new HttpException('Email already exists!', HttpStatus.CONFLICT);

    const updated = await this.authRepository.changeEmail(user, newEmail);
    if (!updated) throw new HttpException('Server Error!', HttpStatus.CONFLICT);

    // delete otp
    this.otpTokenRepository.deleteByToken(otpToken.token);

    return 'Change email successfully!';
  }

  async lockedAccount(user: IUserCreated, data: UserLogin) {
    if (user.email !== data.email)
      throw new HttpException('Invalid email', HttpStatus.BAD_REQUEST);
    const { isValid } = await this.verifyPassword(data);
    if (!isValid)
      throw new HttpException('Wrong password!', HttpStatus.BAD_REQUEST);
    return await this.authRepository.lockedAccount(user);
  }

  generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
    });
  }

  async fixBug() {
    return await this.authRepository.fixBug();
  }
}
