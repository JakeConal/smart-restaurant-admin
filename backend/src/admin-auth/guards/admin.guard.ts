import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check if JWT is valid
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      console.log('JWT validation failed');
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('User from token:', user);

    // Check if user has admin role
    const isAdmin = user && user.role === 'admin';
    console.log('Is admin:', isAdmin);
    return isAdmin;
  }
}
