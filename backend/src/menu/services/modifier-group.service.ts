import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateModifierGroupDto } from '../dto/create-modifier-group.dto';
import { ModifierGroup } from '../entities/modifier-group.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ModifierGroupService {
  private readonly logger = new Logger(ModifierGroupService.name);

  constructor(
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepo: Repository<ModifierGroup>,
  ) { }

  async createGroup(restaurantId: string, dto: CreateModifierGroupDto) {
    this.logger.debug('Creating modifier group', {
      restaurantId,
      name: dto.name,
    });
    try {
      const group = this.modifierGroupRepo.create({
        restaurantId,
        ...dto,
      });
      const result = await this.modifierGroupRepo.save(group);
      this.logger.debug(`Modifier group created successfully: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('Error creating modifier group', error);
      throw error;
    }
  }

  async updateGroup(
    id: string,
    restaurantId: string,
    dto: CreateModifierGroupDto,
  ) {
    try {
      const group = await this.modifierGroupRepo.findOne({
        where: { id, restaurantId },
      });

      if (!group) {
        throw new NotFoundException('Modifier group not found');
      }

      Object.assign(group, dto);
      return this.modifierGroupRepo.save(group);
    } catch (error) {
      this.logger.error('Error updating modifier group', error);
      throw error;
    }
  }

  async findAllByRestaurant(restaurantId: string) {
    try {
      this.logger.debug(
        `Fetching modifier groups for restaurant: ${restaurantId}`,
      );
      const result = await this.modifierGroupRepo.find({
        where: { restaurantId },
        relations: ['options'],
        order: { displayOrder: 'ASC', name: 'ASC' },
      });
      this.logger.debug(`Found ${result.length} modifier groups`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching modifier groups for restaurant ${restaurantId}`,
        error,
      );
      // Return empty array on error to prevent app crash
      return [];
    }
  }

  async findOneByRestaurant(id: string, restaurantId: string) {
    const group = await this.modifierGroupRepo.findOne({
      where: { id, restaurantId },
      relations: ['options'],
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return group;
  }

  async deleteGroup(id: string, restaurantId: string) {
    const group = await this.modifierGroupRepo.findOne({
      where: { id, restaurantId },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    // Check if it's attached to any items? 
    // Usually we just delete and foreign keys handle it or we soft delete.
    // The schema might have cascades.
    try {
      await this.modifierGroupRepo.remove(group);
    } catch (error) {
      this.logger.error('Error deleting modifier group', error);
      throw error;
    }
  }
}

