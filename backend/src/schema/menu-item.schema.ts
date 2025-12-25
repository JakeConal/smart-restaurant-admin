import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MenuItemStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  SOLD_OUT = 'sold_out',
}

@Entity('menu_items')
@Index(['restaurantId'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  restaurantId: string;

  @Column('uuid')
  categoryId: string;

  @Column({ length: 80 })
  name: string;

  @Column('decimal', { precision: 12, scale: 2 })
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
