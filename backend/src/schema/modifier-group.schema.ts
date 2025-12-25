import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SelectionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

@Entity()
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
