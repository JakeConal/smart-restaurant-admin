import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Users } from './user.schema';
import * as bcrypt from 'bcrypt';

@Entity('user_credentials')
export class UserCredentials {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'timestamp', nullable: true })
  password_updated_at: Date;

  @Column({ type: 'int', default: 0 })
  failed_login_count: number;

  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => Users, user => user.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  incrementFailedAttempts(): void {
    this.failed_login_count += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.failed_login_count >= 5) {
      const lockoutDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
      this.locked_until = new Date(Date.now() + lockoutDuration);
    }
  }

  resetFailedAttempts(): void {
    this.failed_login_count = 0;
    this.locked_until = null;
  }

  isLocked(): boolean {
    if (!this.locked_until) return false;
    return new Date() < this.locked_until;
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
