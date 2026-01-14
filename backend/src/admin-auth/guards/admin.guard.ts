import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('admin-jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check if JWT is valid
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has valid role (admin, waiter, or kitchen staff)
    // This guard just verifies they are authenticated staff, not customer
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'WAITER', 'KITCHEN'];
    const hasValidRole = user && validRoles.includes(user.role?.toUpperCase());
    
    return hasValidRole;
  }
}
