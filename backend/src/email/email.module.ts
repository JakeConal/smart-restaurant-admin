import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
