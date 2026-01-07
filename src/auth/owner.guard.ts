import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { Role } from './role.enum';

@Injectable()
export class OwnerGuard implements CanActivate {
  private readonly logger = new Logger(OwnerGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    const targetUserId = params.userId;

    if (!user) {
      this.logger.warn('Authorization attempt without user object');
      return false;
    }

    if (!targetUserId) {
      this.logger.error(`Authorization attempt without userId parameter by user ${user.id}`);
      throw new BadRequestException('userId parameter is required');
    }

    if (user.role === Role.Admin) {
      this.logger.debug(`Admin ${user.id} accessing user ${targetUserId} data`);
      return true;
    }

    if (user.id === targetUserId) {
      this.logger.debug(`User ${user.id} accessing own data`);
      return true;
    }

    this.logger.warn(`Unauthorized access attempt: user ${user.id} tried to access user ${targetUserId} data`);
    throw new ForbiddenException('You can only access your own data');
  }
}
