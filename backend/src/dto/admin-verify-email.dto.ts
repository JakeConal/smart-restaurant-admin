import { IsNotEmpty, IsString } from 'class-validator';

export class AdminVerifyEmailDto {
  @IsNotEmpty({ message: 'Verification token is required' })
  @IsString()
  token: string;
}
