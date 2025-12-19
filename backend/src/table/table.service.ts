import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from '../schema/table.schema';
import { CreateTableDto } from '../dto/create-table.dto';
import { UpdateTableDto } from '../dto/update-table.dto';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
  ) {}

  async create(dto: CreateTableDto): Promise<Table> {
    // Check unique table number
    const exist = await this.tableRepo.findOne({
      where: { tableNumber: dto.tableNumber },
    });

    if (exist) {
      throw new BadRequestException('Table number already exists');
    }

    const table = this.tableRepo.create({
      tableNumber: dto.tableNumber,
      capacity: dto.capacity,
      location: dto.location,
      description: dto.description,
      status: 'active',
    });

    return this.tableRepo.save(table);
  }

  async findAll(query: {
    status?: 'active' | 'inactive';
    location?: string;
    sortBy?: 'tableNumber' | 'capacity' | 'createdAt';
  }): Promise<Table[]> {
    const { status, location, sortBy } = query;

    return this.tableRepo.find({
      where: {
        ...(status && { status }),
        ...(location && { location }),
      },
      order: {
        [sortBy || 'createdAt']: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tableRepo.findOne({ where: { id } });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async update(id: string, dto: UpdateTableDto): Promise<Table> {
    const table = await this.findOne(id);

    // If update table number → check unique
    if (dto.tableNumber && dto.tableNumber !== table.tableNumber) {
      const exist = await this.tableRepo.findOne({
        where: { tableNumber: dto.tableNumber },
      });

      if (exist) {
        throw new BadRequestException('Table number already exists');
      }
    }

    Object.assign(table, dto);
    return this.tableRepo.save(table);
  }

  async changeStatus(
    id: string,
    status: 'active' | 'inactive',
  ): Promise<Table> {
    const table = await this.findOne(id);

    table.status = status;
    return this.tableRepo.save(table);
  }
}
