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
import { QrService } from './qr.service';
import archiver from 'archiver';
import { Readable } from 'stream';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    private readonly qrService: QrService,
  ) {}

  async create(dto: CreateTableDto, restaurantId: string): Promise<Table> {
    // Check unique table number within the restaurant
    const exist = await this.tableRepo.findOne({
      where: { tableNumber: dto.tableNumber, restaurantId },
    });

    if (exist) {
      throw new BadRequestException(
        'Table number already exists in this restaurant',
      );
    }

    const table = this.tableRepo.create({
      restaurantId,
      tableNumber: dto.tableNumber,
      capacity: dto.capacity,
      location: dto.location,
      description: dto.description,
      status: 'active',
    });

    const savedTable = await this.tableRepo.save(table);

    // Generate QR code automatically for new table
    try {
      const token = this.qrService.generateToken(savedTable.id, restaurantId);
      savedTable.qrToken = token;
      savedTable.qrTokenCreatedAt = new Date();
      return await this.tableRepo.save(savedTable);
    } catch (error) {
      console.error('Failed to generate initial QR code:', error);
      return savedTable;
    }
  }

  async findAll(
    query: {
      status?: 'active' | 'inactive';
      location?: string;
      sortBy?: 'tableNumber' | 'capacity' | 'createdAt';
    },
    restaurantId: string,
  ): Promise<Table[]> {
    const { status, location, sortBy } = query;

    return this.tableRepo.find({
      where: {
        restaurantId,
        ...(status && { status }),
        ...(location && { location }),
      },
      relations: ['waiter'],
      order: {
        [sortBy || 'createdAt']: 'ASC',
      },
    });
  }

  async findByWaiterId(
    waiterId: string,
    restaurantId: string,
  ): Promise<Table[]> {
    return this.tableRepo.find({
      where: {
        restaurantId,
        waiter_id: waiterId,
      },
      relations: ['waiter'],
      order: {
        tableNumber: 'ASC',
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

    // If update table number → check unique within restaurant
    if (dto.tableNumber && dto.tableNumber !== table.tableNumber) {
      const exist = await this.tableRepo.findOne({
        where: {
          tableNumber: dto.tableNumber,
          restaurantId: table.restaurantId,
        },
      });

      if (exist) {
        throw new BadRequestException(
          'Table number already exists in this restaurant',
        );
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

  async remove(id: string): Promise<void> {
    const table = await this.findOne(id);
    await this.tableRepo.remove(table);
  }

  async generateQrCode(id: string): Promise<{
    table: Table;
    qrCodeDataUrl: string;
    qrCodeUrl: string;
  }> {
    const table = await this.findOne(id);

    // Generate new token
    const token = this.qrService.generateToken(table.id, table.restaurantId);
    const qrUrl = this.qrService.generateQrUrl(token);
    const qrCodeDataUrl = await this.qrService.generateQrCodeDataUrl(qrUrl);

    // Update table with new token
    table.qrToken = token;
    table.qrTokenCreatedAt = new Date();
    await this.tableRepo.save(table);

    return {
      table,
      qrCodeDataUrl,
      qrCodeUrl: qrUrl,
    };
  }

  async regenerateQrCode(id: string): Promise<{
    table: Table;
    qrCodeDataUrl: string;
    qrCodeUrl: string;
  }> {
    // Same as generateQrCode - invalidates old token by generating new one
    return this.generateQrCode(id);
  }

  async getQrCodeDataUrl(id: string): Promise<{ dataUrl: string }> {
    const table = await this.findOne(id);

    if (!table.qrToken) {
      throw new BadRequestException('QR code not generated for this table');
    }

    const qrUrl = this.qrService.generateQrUrl(table.qrToken);
    const dataUrl = await this.qrService.generateQrCodeDataUrl(qrUrl);

    return { dataUrl };
  }

  async downloadQrCodePng(id: string): Promise<Buffer> {
    const table = await this.findOne(id);

    if (!table.qrToken) {
      throw new BadRequestException('QR code not generated for this table');
    }

    const qrUrl = this.qrService.generateQrUrl(table.qrToken);
    return this.qrService.generateQrCodePng(qrUrl);
  }

  async downloadQrCodePdf(id: string): Promise<Buffer> {
    const table = await this.findOne(id);

    if (!table.qrToken) {
      throw new BadRequestException('QR code not generated for this table');
    }

    const qrUrl = this.qrService.generateQrUrl(table.qrToken);
    const qrCodeDataUrl = await this.qrService.generateQrCodeDataUrl(qrUrl);

    return this.qrService.generateQrCodePdf(table.tableNumber, qrCodeDataUrl);
  }

  async downloadAllQrCodes(restaurantId: string): Promise<Buffer> {
    const tables = await this.tableRepo.find({
      where: { status: 'active', restaurantId },
    });

    const tablesWithQr = tables.filter((t) => t.qrToken);

    if (tablesWithQr.length === 0) {
      throw new BadRequestException('No tables with QR codes found');
    }

    const qrData = await Promise.all(
      tablesWithQr.map(async (table) => {
        const qrUrl = this.qrService.generateQrUrl(table.qrToken);
        const qrCodeDataUrl = await this.qrService.generateQrCodeDataUrl(qrUrl);
        return {
          tableNumber: table.tableNumber,
          qrCodeDataUrl,
        };
      }),
    );

    return this.qrService.generateBulkQrCodesPdf(qrData);
  }

  async regenerateAllQrCodes(
    restaurantId: string,
  ): Promise<{ count: number; tables: Table[] }> {
    const tables = await this.tableRepo.find({
      where: { status: 'active', restaurantId },
    });

    const updatedTables = await Promise.all(
      tables.map(async (table) => {
        const token = this.qrService.generateToken(
          table.id,
          table.restaurantId,
        );
        table.qrToken = token;
        table.qrTokenCreatedAt = new Date();
        return this.tableRepo.save(table);
      }),
    );

    return {
      count: updatedTables.length,
      tables: updatedTables,
    };
  }

  async verifyQrToken(token: string): Promise<Table | null> {
    const decoded = this.qrService.verifyToken(token);

    if (!decoded) {
      return null;
    }

    const table = await this.tableRepo.findOne({
      where: { id: decoded.tableId },
    });

    if (!table) {
      return null;
    }

    // Check if the token matches the current token
    if (table.qrToken !== token) {
      return null; // Token has been regenerated/invalidated
    }

    return table;
  }

  async downloadAllQrCodesZip(restaurantId: string): Promise<Readable> {
    const tables = await this.tableRepo.find({
      where: { status: 'active', restaurantId },
    });

    const tablesWithQr = tables.filter((t) => t.qrToken);

    if (tablesWithQr.length === 0) {
      throw new BadRequestException('No tables with QR codes found');
    }

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Generate PNG for each table and add to archive
    for (const table of tablesWithQr) {
      const qrUrl = this.qrService.generateQrUrl(table.qrToken);
      const pngBuffer = await this.qrService.generateQrCodePng(qrUrl);
      archive.append(pngBuffer, { name: `table-${table.tableNumber}-qr.png` });
    }

    await archive.finalize();

    return archive;
  }
}
