import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModifierOption } from '../schema/modifier-option.schema';
import { CreateModifierOptionDto } from '../dto/create-modifier-option.dto';

@Injectable()
export class ModifierOptionService {
  constructor(
    @InjectRepository(ModifierOption)
    private readonly repo: Repository<ModifierOption>,
  ) {}

  async createOption(groupId: string, dto: CreateModifierOptionDto) {
    const option = this.repo.create({
      groupId,
      ...dto,
    });
    return this.repo.save(option);
  }

  async findByGroup(groupId: string) {
    return this.repo.find({ where: { groupId } });
  }
}
