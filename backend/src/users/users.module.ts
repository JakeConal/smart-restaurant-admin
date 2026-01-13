import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from '../schema/user.schema';
import { UserCredentials } from '../schema/user-credentials.schema';
import { Role } from '../schema/role.schema';
import { Table } from '../schema/table.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserCredentials, Role, Table]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
