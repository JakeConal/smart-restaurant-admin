import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModifierOption } from '../entities/modifier-option.entity';
import { ModifierGroup } from '../entities/modifier-group.entity';
import { CreateModifierOptionDto } from '../dto/create-modifier-option.dto';

@Injectable()
export class ModifierOptionService {
  private readonly logger = new Logger(ModifierOptionService.name);

  constructor(
    @InjectRepository(ModifierOption)
    private readonly repo: Repository<ModifierOption>,
    @InjectRepository(ModifierGroup)
    private readonly groupRepo: Repository<ModifierGroup>,
  ) { }

  async createOption(groupId: string, dto: CreateModifierOptionDto) {
    this.logger.debug('Creating modifier option', {
      groupId,
      name: dto.name,
    });
    const option = this.repo.create({
      groupId,
      ...dto,
    });
    const result = await this.repo.save(option);
    this.logger.debug(`Modifier option created successfully: ${result.id}`);
    return result;
  }

  async updateOption(
    id: string,
    restaurantId: string,
    dto: CreateModifierOptionDto,
  ) {
    const option = await this.repo.findOne({
      where: { id },
      relations: ['group'],
    });

    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    // Verify the option belongs to a group in this restaurant
    const group = await this.groupRepo.findOne({
      where: { id: option.groupId, restaurantId },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    Object.assign(option, dto);
    return this.repo.save(option);
  }

  async findByGroup(groupId: string) {
    return this.repo.find({ where: { groupId } });
  }

  async deleteOption(id: string, restaurantId: string) {
    const option = await this.repo.findOne({
      where: { id },
      relations: ['group'],
    });

    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    // Verify the option belongs to a group in this restaurant
    const group = await this.groupRepo.findOne({
      where: { id: option.groupId, restaurantId },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    await this.repo.remove(option);
  }
}

