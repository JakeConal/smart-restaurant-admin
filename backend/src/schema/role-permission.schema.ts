import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.schema';
import { Permission } from './permission.schema';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn('uuid')
  role_id: string;

  @PrimaryColumn('uuid')
  permission_id: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Role, role => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, permission => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
