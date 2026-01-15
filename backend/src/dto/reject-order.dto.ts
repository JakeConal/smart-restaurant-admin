import { IsString, IsNotEmpty } from 'class-validator';

export class RejectOrderDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
