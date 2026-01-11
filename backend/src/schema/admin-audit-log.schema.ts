import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AdminAuditAction {
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  RESET_FAILED = 'RESET_FAILED',
  VERIFICATION_SENT = 'VERIFICATION_SENT',
  RESET_TOKEN_SENT = 'RESET_TOKEN_SENT',
  ORDER_ESCALATED = 'ORDER_ESCALATED',
  ORDER_REASSIGNED = 'ORDER_REASSIGNED',
}

export enum AdminAuditStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('admin_audit_logs')
@Index(['userId', 'createdAt'])
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: AdminAuditAction,
  })
  action: AdminAuditAction;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON string

  @Column({
    type: 'enum',
    enum: AdminAuditStatus,
  })
  status: AdminAuditStatus;

  @CreateDateColumn()
  createdAt: Date;
}
