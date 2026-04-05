import {
  IsEmail,
  IsString,
  Length,
  IsOptional,
} from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255, { message: 'Full name must be between 2 and 255 characters' })
  full_name?: string;
}
