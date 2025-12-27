import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  restaurantId: string;

  @Column({ default: 'admin' })
  role: string;

  @Column()
  restaurantName: string;
}
