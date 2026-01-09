import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from './user.schema';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  token_hash: string; // SHA256 hash of the actual token

  @Column('uuid')
  family_id: string; // Group tokens by device/session

  @Column({ type: 'timestamp' })
  issued_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date;

  @Column({ type: 'uuid', nullable: true })
  replaced_by_token_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Users, user => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => RefreshToken, { nullable: true })
  @JoinColumn({ name: 'replaced_by_token_id' })
  replacedBy: RefreshToken;

  // Methods
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  isRevoked(): boolean {
    return this.revoked_at !== null;
  }

  revoke(): void {
    this.revoked_at = new Date();
  }
}
