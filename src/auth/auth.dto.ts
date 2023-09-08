import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserRegister {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  password: string;
}

export class UserLogin {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class ForgotPassword {
  @IsNotEmpty()
  newPassword: string;

  @IsNotEmpty()
  rePassword: string;
}

export class ChangePassword extends ForgotPassword {
  @IsNotEmpty()
  olderPassword: string;
}

export class ChangeUsername {
  firstName: string;
  lastName: string;
}
