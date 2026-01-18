import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ModifierGroup } from './modifier-group.schema';

@Entity()
@Index(['groupId'])
export class ModifierOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  groupId: string;

  @ManyToOne(() => ModifierGroup, (group) => group.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: ModifierGroup;

  @Column()
  name: string;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  priceAdjustment: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
