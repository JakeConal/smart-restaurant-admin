import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class RejectOrderDto {
  @IsUUID()
  waiter_id: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
