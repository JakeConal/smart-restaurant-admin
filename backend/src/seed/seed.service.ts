import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../schema/Role';
import { Permission } from '../schema/Permission';
import { RolePermission } from '../schema/RolePermission';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async seedAll() {
    console.log('🌱 Starting database seed...');
    
    await this.seedRoles();
    await this.seedPermissions();
    await this.seedRolePermissions();
    
    console.log('✅ Database seed completed!');
  }

  private async seedRoles() {
    const existingRoles = await this.roleRepository.count();
    if (existingRoles > 0) {
      console.log('⏭️  Roles already seeded, skipping...');
      return;
    }

    const roles = [
      {
        code: 'ADMIN',
        name: 'Restaurant Admin',
        description: 'Full system access',
        is_system: true,
      },
      {
        code: 'WAITER',
        name: 'Waiter Staff',
        description: 'Manage orders and tables',
        is_system: true,
      },
      {
        code: 'KITCHEN',
        name: 'Kitchen Staff',
        description: 'View and update order status',
        is_system: true,
      },
    ];

    await this.roleRepository.save(roles);
    console.log('✓ Seeded 3 roles');
  }

  private async seedPermissions() {
    const existingPermissions = await this.permissionRepository.count();
    if (existingPermissions > 0) {
      console.log('⏭️  Permissions already seeded, skipping...');
      return;
    }

    const permissions = [
      // Menu permissions
      { code: 'menu:read', resource: 'menu', action: 'read', description: 'View menu items' },
      { code: 'menu:write', resource: 'menu', action: 'write', description: 'Create/Edit menu items' },
      { code: 'menu:create', resource: 'menu', action: 'create', description: 'Create menu items' },
      { code: 'menu:delete', resource: 'menu', action: 'delete', description: 'Delete menu items' },
      
      // Order permissions
      { code: 'order:read', resource: 'order', action: 'read', description: 'View orders' },
      { code: 'order:create', resource: 'order', action: 'create', description: 'Create orders' },
      { code: 'order:update_status', resource: 'order', action: 'update', description: 'Update order status' },
      { code: 'order:cancel', resource: 'order', action: 'cancel', description: 'Cancel orders' },
      
      // Table permissions
      { code: 'table:read', resource: 'table', action: 'read', description: 'View tables' },
      { code: 'table:manage', resource: 'table', action: 'manage', description: 'Manage table settings' },
      { code: 'table:assign', resource: 'table', action: 'assign', description: 'Assign tables' },
      
      // User permissions (Admin only)
      { code: 'user:read', resource: 'user', action: 'read', description: 'View users' },
      { code: 'user:create', resource: 'user', action: 'create', description: 'Create users' },
      { code: 'user:update', resource: 'user', action: 'update', description: 'Update users' },
      { code: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },
      
      // Report permissions (Admin only)
      { code: 'report:view', resource: 'report', action: 'view', description: 'View reports' },
      { code: 'report:export', resource: 'report', action: 'export', description: 'Export reports' },
    ];

    await this.permissionRepository.save(permissions);
    console.log('✓ Seeded 17 permissions');
  }

  private async seedRolePermissions() {
    const existingMappings = await this.rolePermissionRepository.count();
    if (existingMappings > 0) {
      console.log('⏭️  Role permissions already seeded, skipping...');
      return;
    }

    const adminRole = await this.roleRepository.findOne({ where: { code: 'ADMIN' } });
    const waiterRole = await this.roleRepository.findOne({ where: { code: 'WAITER' } });
    const kitchenRole = await this.roleRepository.findOne({ where: { code: 'KITCHEN' } });

    // ADMIN gets all permissions
    const allPermissions = await this.permissionRepository.find();
    const adminMappings = allPermissions.map(permission => ({
      role_id: adminRole.id,
      permission_id: permission.id,
    }));

    // WAITER gets specific permissions
    const waiterPermissionCodes = [
      'menu:read',
      'order:read', 'order:create', 'order:update_status',
      'table:read', 'table:assign',
    ];
    const waiterPermissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.code IN (:...codes)', { codes: waiterPermissionCodes })
      .getMany();
    const waiterMappings = waiterPermissions.map(permission => ({
      role_id: waiterRole.id,
      permission_id: permission.id,
    }));

    // KITCHEN gets specific permissions
    const kitchenPermissionCodes = ['order:read', 'order:update_status'];
    const kitchenPermissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.code IN (:...codes)', { codes: kitchenPermissionCodes })
      .getMany();
    const kitchenMappings = kitchenPermissions.map(permission => ({
      role_id: kitchenRole.id,
      permission_id: permission.id,
    }));

    await this.rolePermissionRepository.save([
      ...adminMappings,
      ...waiterMappings,
      ...kitchenMappings,
    ]);
    
    console.log(`✓ Seeded role permissions (ADMIN: ${adminMappings.length}, WAITER: ${waiterMappings.length}, KITCHEN: ${kitchenMappings.length})`);
  }
}
