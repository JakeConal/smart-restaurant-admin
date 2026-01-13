import {
  IsEmail,
  IsString,
  MinLength,
  Length,
  Matches,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class UpdateWaiterDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255, { message: 'Full name must be between 2 and 255 characters' })
  full_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatar_url?: string;
}
