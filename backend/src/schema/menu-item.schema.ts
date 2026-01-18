import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { MenuCategory } from './menu-category.schema';
import { MenuItemPhoto } from './menu-item-photo.schema';
import { MenuItemModifierGroup } from './menu-item-modifier.schema';
import { ModifierGroup } from './modifier-group.schema';

export enum MenuItemStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  SOLD_OUT = 'sold_out',
}

@Entity('menu_items')
@Index(['restaurantId'])
@Index(['categoryId'])
@Index(['name'])
@Index(['restaurantId', 'isDeleted', 'status'])
@Index(['restaurantId', 'categoryId', 'isDeleted', 'status'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  restaurantId: string;

  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => MenuCategory)
  @JoinColumn({ name: 'categoryId' })
  category: MenuCategory;

  @OneToMany(() => MenuItemPhoto, (photo) => photo.menuItem)
  photos: MenuItemPhoto[];

  @OneToMany(() => MenuItemModifierGroup, (modifier) => modifier.menuItem)
  modifierGroupLinks: MenuItemModifierGroup[];

  @ManyToMany(() => ModifierGroup)
  @JoinTable({
    name: 'menu_item_modifier_groups',
    joinColumn: { name: 'menuItemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'groupId', referencedColumnName: 'id' },
  })
  modifierGroups: ModifierGroup[];

  @Column({ length: 80 })
  name: string;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 0 })
  prepTimeMinutes: number;

  @Column({
    type: 'enum',
    enum: MenuItemStatus,
  })
  status: MenuItemStatus;

  @Column({ default: false })
  isChefRecommended: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'int', default: 0 })
  popularityScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
