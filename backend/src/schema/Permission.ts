import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { RolePermission } from './RolePermission';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  code: string; // 'menu:write', 'order:create', etc.

  @Column({ length: 50 })
  resource: string; // 'menu', 'order', 'table', 'user'

  @Column({ length: 50 })
  action: string; // 'read', 'write', 'create', 'delete', 'update'

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  rolePermissions: RolePermission[];
}
