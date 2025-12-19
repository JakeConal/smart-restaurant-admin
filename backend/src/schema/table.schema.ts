import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['tableNumber'])
export class Table {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'table_number', length: 50 }) tableNumber: string;
  @Column({ type: 'int' }) capacity: number;
  @Column({ length: 100, nullable: true }) location?: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'varchar', length: 20, default: 'active' }) status:
    | 'active'
    | 'inactive';
  @Column({ type: 'varchar', length: 500, nullable: true }) qrToken?: string;
  @Column({ type: 'timestamp', nullable: true }) qrTokenCreatedAt?: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
