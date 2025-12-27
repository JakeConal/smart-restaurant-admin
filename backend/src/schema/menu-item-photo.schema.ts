import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.schema';

@Entity('menu_item_photos')
@Index(['menuItemId'])
export class MenuItemPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  menuItemId: string;

  @ManyToOne(() => MenuItem, (item) => item.photos)
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column()
  url: string;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
