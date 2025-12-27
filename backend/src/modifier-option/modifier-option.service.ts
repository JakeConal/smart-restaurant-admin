import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModifierOption } from '../schema/modifier-option.schema';
import { ModifierGroup } from '../schema/modifier-group.schema';
import { CreateModifierOptionDto } from '../dto/create-modifier-option.dto';

@Injectable()
export class ModifierOptionService {
  constructor(
    @InjectRepository(ModifierOption)
    private readonly repo: Repository<ModifierOption>,
    @InjectRepository(ModifierGroup)
    private readonly groupRepo: Repository<ModifierGroup>,
  ) {}

  async createOption(groupId: string, dto: CreateModifierOptionDto) {
    console.log(
      'Service: Creating modifier option for group:',
      groupId,
      'with data:',
      dto,
    );
    const option = this.repo.create({
      groupId,
      ...dto,
    });
    const result = await this.repo.save(option);
    console.log('Service: Modifier option created successfully:', result);
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
}
