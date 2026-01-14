import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../schema/role.schema';
import { Permission } from '../schema/permission.schema';
import { RolePermission } from '../schema/role-permission.schema';
import { Users, UserStatus } from '../schema/user.schema';
import { UserCredentials } from '../schema/user-credentials.schema';
import { Table } from '../schema/table.schema';
import { Order, OrderStatus } from '../schema/order.schema';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(UserCredentials)
    private credentialsRepository: Repository<UserCredentials>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async seedAll() {
    console.log('🌱 Starting database seed...');

    await this.seedRoles();
    await this.seedPermissions();
    await this.seedRolePermissions();
    await this.seedSuperAdmin();
    await this.seedTablesAndOrders();

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
        code: 'SUPER_ADMIN',
        name: 'Super Administrator',
        description: 'Manage all admin accounts across restaurants',
        is_system: true,
      },
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
    console.log('✓ Seeded 4 roles');
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

      // Admin management permissions (Super Admin only)
      { code: 'admin:read', resource: 'admin', action: 'read', description: 'View admin accounts' },
      { code: 'admin:create', resource: 'admin', action: 'create', description: 'Create admin accounts' },
      { code: 'admin:update', resource: 'admin', action: 'update', description: 'Update admin accounts' },
      { code: 'admin:delete', resource: 'admin', action: 'delete', description: 'Deactivate admin accounts' },
    ];

    await this.permissionRepository.save(permissions);
    console.log('✓ Seeded 21 permissions');
  }

  private async seedRolePermissions() {
    const existingMappings = await this.rolePermissionRepository.count();
    if (existingMappings > 0) {
      console.log('⏭️  Role permissions already seeded, skipping...');
      return;
    }

    const superAdminRole = await this.roleRepository.findOne({ where: { code: 'SUPER_ADMIN' } });
    const adminRole = await this.roleRepository.findOne({ where: { code: 'ADMIN' } });
    const waiterRole = await this.roleRepository.findOne({ where: { code: 'WAITER' } });
    const kitchenRole = await this.roleRepository.findOne({ where: { code: 'KITCHEN' } });

    // SUPER_ADMIN gets only admin management permissions
    const superAdminPermissionCodes = ['admin:read', 'admin:create', 'admin:update', 'admin:delete'];
    const superAdminPermissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.code IN (:...codes)', { codes: superAdminPermissionCodes })
      .getMany();
    const superAdminMappings = superAdminPermissions.map(permission => ({
      role_id: superAdminRole.id,
      permission_id: permission.id,
    }));

    // ADMIN gets all permissions except admin management
    const allPermissions = await this.permissionRepository.find();
    const adminMappings = allPermissions
      .filter(permission => !superAdminPermissionCodes.includes(permission.code))
      .map(permission => ({
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
      ...superAdminMappings,
      ...adminMappings,
      ...waiterMappings,
      ...kitchenMappings,
    ]);

    console.log(`✓ Seeded role permissions (SUPER_ADMIN: ${superAdminMappings.length}, ADMIN: ${adminMappings.length}, WAITER: ${waiterMappings.length}, KITCHEN: ${kitchenMappings.length})`);
  }

  private async seedSuperAdmin() {
    const superAdminEmail = 'superadmin@smartrestaurant.com';

    // Check if super admin already exists
    const existingSuperAdmin = await this.userRepository.findOne({
      where: { email: superAdminEmail },
    });

    if (existingSuperAdmin) {
      console.log('⏭️  Super Admin already exists, skipping...');
      return;
    }

    // Get SUPER_ADMIN role
    const superAdminRole = await this.roleRepository.findOne({
      where: { code: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      console.log('❌ SUPER_ADMIN role not found, skipping super admin seed');
      return;
    }

    // Create Super Admin user
    const superAdmin = this.userRepository.create({
      email: superAdminEmail,
      full_name: 'Super Administrator',
      role_id: superAdminRole.id,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      restaurantId: 'system',
    });

    await this.userRepository.save(superAdmin);

    // Create credentials (password: SuperAdmin@123)
    const passwordHash = await UserCredentials.hashPassword('SuperAdmin@123');
    const credentials = this.credentialsRepository.create({
      user_id: superAdmin.id,
      password_hash: passwordHash,
      password_updated_at: new Date(),
    });

    await this.credentialsRepository.save(credentials);

    console.log('✓ Seeded Super Admin user:');
    console.log('  📧 Email: superadmin@smartrestaurant.com');
    console.log('  🔑 Password: SuperAdmin@123');
  }

  private async seedTablesAndOrders() {
    // Find user with email huynhthaitoan254@gmail.com
    const user = await this.userRepository.findOne({
      where: { email: 'huynhthaitoan254@gmail.com' },
      relations: ['role'],
    });

    if (!user) {
      console.log('⏭️  User huynhthaitoan254@gmail.com not found, skipping tables and orders seed');
      return;
    }

    // Check if tables already exist for this user
    const existingTables = await this.tableRepository.count({
      where: { restaurantId: user.id },
    });

    if (existingTables > 0) {
      console.log('⏭️  Tables already exist for this user, skipping...');
      return;
    }

    // Create tables
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      const table = this.tableRepository.create({
        restaurantId: user.id,
        tableNumber: `T${i}`,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        status: 'active',
        occupancyStatus: 'available',
        qrToken: `QR-TABLE-${i}-${Date.now()}`,
        qrTokenCreatedAt: new Date(),
      });
      tables.push(table);
    }

    await this.tableRepository.save(tables);
    console.log(`✓ Seeded 10 tables for user ${user.email}`);

    // Create sample orders
    const orders = [];
    const now = new Date();

    // Order 1: Recent pending order (2 minutes ago)
    const order1 = this.orderRepository.create({
      orderId: `order-${Date.now()}-1`,
      table_id: tables[0].id,
      tableNumber: tables[0].tableNumber,
      guestName: 'Nguyễn Văn A',
      items: [
        {
          id: '1',
          menuItemId: 'menu-item-1',
          menuItemName: 'Phở Bò',
          quantity: 2,
          unitPrice: 50000,
          totalPrice: 100000,
        },
        {
          id: '2',
          menuItemId: 'menu-item-2',
          menuItemName: 'Cà Phê Sữa',
          quantity: 1,
          unitPrice: 25000,
          totalPrice: 25000,
        },
      ],
      subtotal: 125000,
      tax: 12500,
      total: 137500,
      status: OrderStatus.PENDING_ACCEPTANCE,
      createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
    });
    orders.push(order1);

    // Order 2: Pending order (4 minutes ago)
    const order2 = this.orderRepository.create({
      orderId: `order-${Date.now()}-2`,
      table_id: tables[1].id,
      tableNumber: tables[1].tableNumber,
      guestName: 'Trần Thị B',
      items: [
        {
          id: '1',
          menuItemId: 'menu-item-3',
          menuItemName: 'Bún Chả',
          quantity: 1,
          unitPrice: 60000,
          totalPrice: 60000,
        },
      ],
      subtotal: 60000,
      tax: 6000,
      total: 66000,
      status: OrderStatus.PENDING_ACCEPTANCE,
      createdAt: new Date(now.getTime() - 4 * 60 * 1000), // 4 minutes ago
    });
    orders.push(order2);

    // Order 4: Accepted order
    const order4 = this.orderRepository.create({
      orderId: `order-${Date.now()}-4`,
      table_id: tables[3].id,
      tableNumber: tables[3].tableNumber,
      guestName: 'Phạm Thị D',
      items: [
        {
          id: '1',
          menuItemId: 'menu-item-5',
          menuItemName: 'Bánh Mì',
          quantity: 2,
          unitPrice: 20000,
          totalPrice: 40000,
        },
      ],
      subtotal: 40000,
      tax: 4000,
      total: 44000,
      status: OrderStatus.ACCEPTED,
      acceptedAt: new Date(now.getTime() - 1 * 60 * 1000),
      createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
    });
    orders.push(order4);

    // Order 5: Completed order
    const order5 = this.orderRepository.create({
      orderId: `order-${Date.now()}-5`,
      table_id: tables[4].id,
      tableNumber: tables[4].tableNumber,
      guestName: 'Hoàng Văn E',
      items: [
        {
          id: '1',
          menuItemId: 'menu-item-6',
          menuItemName: 'Gỏi Cuốn',
          quantity: 4,
          unitPrice: 30000,
          totalPrice: 120000,
        },
      ],
      subtotal: 120000,
      tax: 12000,
      total: 132000,
      status: OrderStatus.COMPLETED,
      acceptedAt: new Date(now.getTime() - 59 * 60 * 1000),
      createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
    });
    orders.push(order5);

    await this.orderRepository.save(orders);
    console.log(`✓ Seeded 5 sample orders for user ${user.email}`);
  }
}
