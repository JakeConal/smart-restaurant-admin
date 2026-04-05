import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerVerifyEmailDto {
  @IsNotEmpty({ message: 'Verification token is required' })
  @IsString()
  token: string;
}
