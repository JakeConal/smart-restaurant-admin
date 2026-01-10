import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.schema';
import { Users } from './user.schema';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string; // 'ADMIN', 'WAITER', 'KITCHEN'

  @Column({ length: 100 })
  name: string; // Display name

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  is_system: boolean; // Prevent deletion of system roles

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => RolePermission, rolePermission => rolePermission.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => Users, user => user.role)
  users: Users[];
}
