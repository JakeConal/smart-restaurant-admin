import { IsEmail, IsNotEmpty } from 'class-validator';

export class AdminForgotPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
