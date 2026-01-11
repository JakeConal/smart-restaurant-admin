import { IsUUID } from 'class-validator';

export class ReassignOrderDto {
  @IsUUID()
  new_waiter_id: string;
}
