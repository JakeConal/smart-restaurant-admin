import { IsUUID } from 'class-validator';

export class SendToKitchenDto {
  @IsUUID()
  waiter_id: string;
}
