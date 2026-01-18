import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateModifierGroupDto } from 'src/dto/create-modifier-group.dto';
import { ModifierGroup } from 'src/schema/modifier-group.schema';
import { Repository } from 'typeorm';

@Injectable()
export class ModifierGroupService {
  constructor(
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepo: Repository<ModifierGroup>,
  ) { }

  async createGroup(restaurantId: string, dto: CreateModifierGroupDto) {
    console.log(
      'Service: Creating modifier group for restaurant:',
      restaurantId,
      'with data:',
      dto,
    );
    try {
      const group = this.modifierGroupRepo.create({
        restaurantId,
        ...dto,
      });
      const result = await this.modifierGroupRepo.save(group);
      console.log('Service: Modifier group created successfully:', result);
      return result;
    } catch (error) {
      console.error('Service: Error creating modifier group:', error);
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
      console.error('Error updating modifier group:', error);
      throw error;
    }
  }

  async findAllByRestaurant(restaurantId: string) {
    try {
      console.log('Fetching modifier groups for restaurant:', restaurantId);
      const result = await this.modifierGroupRepo.find({
        where: { restaurantId },
        relations: ['options'],
        order: { displayOrder: 'ASC', name: 'ASC' },
      });
      console.log(`Found ${result.length} modifier groups`);
      return result;
    } catch (error) {
      console.error(
        'Error fetching modifier groups for restaurant',
        restaurantId,
        ':',
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
      console.error('Error deleting modifier group:', error);
      throw error;
    }
  }
}
