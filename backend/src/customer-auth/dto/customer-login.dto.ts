import { IsString, IsEmail } from 'class-validator';

export class CustomerLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
