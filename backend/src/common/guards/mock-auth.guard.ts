import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Simulate auth via header: x-user-id and x-store-id
    const userId = request.headers['x-user-id'];
    const storeId = request.headers['x-store-id'];

    if (!userId || !storeId) {
      throw new UnauthorizedException(
        'Missing x-user-id or x-store-id headers',
      );
    }

    request.user = {
      id: String(userId),
      storeId: String(storeId),
    };

    return true;
  }
}
