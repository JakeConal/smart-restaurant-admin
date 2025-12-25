import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
