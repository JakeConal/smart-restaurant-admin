import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MenuItemModifierGroup } from './menu-item-modifier.schema';
import { ModifierOption } from './modifier-option.schema';

export enum SelectionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

@Entity()
@Index(['restaurantId'])
export class ModifierGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  restaurantId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: SelectionType })
  selectionType: SelectionType;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: 0 })
  minSelections: number;

  @Column({ default: 0 })
  maxSelections: number;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: 'active' })
  status: string;

  @OneToMany(() => MenuItemModifierGroup, (modifier) => modifier.group)
  menuItems: MenuItemModifierGroup[];

  @OneToMany(() => ModifierOption, (option) => option.group)
  options: ModifierOption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
