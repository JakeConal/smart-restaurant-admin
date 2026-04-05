import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: 'customer' })
  role: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'longblob', nullable: true })
  profilePicture: Buffer;

  @Column({ nullable: true })
  googleId: string;

  @Column({ default: false })
  isGoogleLogin: boolean;

  @Column({ nullable: true })
  googleProfilePicUrl: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerifiedAt: Date;
}
