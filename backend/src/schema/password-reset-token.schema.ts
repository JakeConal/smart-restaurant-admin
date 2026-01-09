import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  email: string;

  @Column({ length: 500 })
  token: string;

  @Column({ nullable: true, length: 1000 })
  tableToken?: string; // Preserve original table token from forgot password request (JWT can be long)

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;
}
