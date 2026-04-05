import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CustomerForgotPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional()
  @IsString()
  tableToken?: string;
}
