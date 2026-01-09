import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Table } from './table.schema';
import { Customer } from './customer.schema';

export enum OrderStatus {
  RECEIVED = 'received',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: string;
  menuItemId: string; // UUID, not number
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: any[];
  specialInstructions?: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  orderId: string; // Custom order ID for frontend (order-{timestamp})

  @Column({ type: 'uuid', nullable: true })
  @ManyToOne(() => Table, { eager: false, nullable: true })
  @JoinColumn({ name: 'table_id' })
  table_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  @ManyToOne(() => Customer, { eager: false, nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer_id: string | null;

  @Column({ type: 'varchar', length: 100 })
  tableNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  guestName: string;

  @Column({ type: 'json' })
  items: OrderItem[];

  @Column({ type: 'text', nullable: true })
  specialRequests: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'datetime', nullable: true })
  billRequestedAt: string | null;

  @Column({ type: 'datetime', nullable: true })
  paidAt: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;
}
