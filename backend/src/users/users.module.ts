import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from './entities/user.schema';
import { UserCredentials } from './entities/user-credentials.schema';
import { Role } from './entities/role.schema';
import { Table } from '../table/entities/table.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserCredentials, Role, Table]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

