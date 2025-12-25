import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateModifierGroupDto } from 'src/dto/create-modifier-group.dto';
import { ModifierGroup } from 'src/schema/modifier-group.schema';
import { Repository } from 'typeorm';

@Injectable()
export class ModifierGroupService {
  constructor(
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepo: Repository<ModifierGroup>,
  ) {}

  async createGroup(restaurantId: string, dto: CreateModifierGroupDto) {
    const group = this.modifierGroupRepo.create({
      restaurantId,
      ...dto,
    });
    return this.modifierGroupRepo.save(group);
  }

  async findAllByRestaurant(restaurantId: string) {
    return this.modifierGroupRepo.find({ where: { restaurantId } });
  }
}
