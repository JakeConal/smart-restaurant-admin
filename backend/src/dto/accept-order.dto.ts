import { IsInt } from 'class-validator';

export class AcceptOrderDto {
  @IsInt()
  version: number;
}
