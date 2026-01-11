import { IsUUID, IsInt } from 'class-validator';

export class AcceptOrderDto {
  @IsUUID()
  waiter_id: string;

  @IsInt()
  version: number;
}
