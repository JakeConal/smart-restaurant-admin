import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    console.log('[JwtAuthGuard] canActivate called');
    const result = super.canActivate(context);
    console.log('[JwtAuthGuard] canActivate result:', result);
    return result;
  }
  
  handleRequest(err: any, user: any, info: any) {
    console.log('[JwtAuthGuard] handleRequest - err:', err, 'user:', user, 'info:', info);
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}
