import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  token: string;

  @Column({ nullable: true, length: 1000 })
  tableToken?: string; // Preserve original table token from signup (JWT can be long)

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;
}
