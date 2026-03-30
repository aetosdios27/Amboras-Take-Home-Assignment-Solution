import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/analytics',
})
export class AnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected — no token provided`);
        client.emit('auth:error', { message: 'No token provided' });
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<{
        sub: string;
        storeId: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev_secret'),
      });

      // Attach user info to the socket for downstream use
      (client as any).user = {
        id: payload.sub,
        storeId: payload.storeId,
      };

      this.logger.log(
        `Client ${client.id} authenticated (user=${payload.sub}, store=${payload.storeId})`,
      );
    } catch (err) {
      this.logger.warn(
        `Client ${client.id} rejected — invalid token: ${(err as Error).message}`,
      );
      client.emit('auth:error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.rooms.forEach((room) => {
      if (room.startsWith('store:')) {
        client.leave(room);
      }
    });
  }

  @SubscribeMessage('join-store')
  handleJoinStore(
    @MessageBody() data: { storeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;

    // Prevent a client from joining a store room they don't belong to
    if (!user || user.storeId !== data.storeId) {
      this.logger.warn(
        `Client ${client.id} tried to join store:${data.storeId} but is authorised for store:${user?.storeId ?? 'none'}`,
      );
      return { status: 'forbidden', reason: 'Store mismatch' };
    }

    // Leave any previous store rooms first
    client.rooms.forEach((room) => {
      if (room.startsWith('store:')) {
        client.leave(room);
      }
    });

    const room = `store:${data.storeId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);

    return { status: 'joined', room };
  }

  /**
   * Called by AnalyticsService when a new event is written.
   * Pushes the event to all clients watching that store.
   */
  pushActivityUpdate(
    storeId: string,
    event: {
      event_id: string;
      event_type: string;
      timestamp: Date;
      product_id: string | null;
      amount: number | null;
      currency: string | null;
    },
  ) {
    this.server.to(`store:${storeId}`).emit('activity:new', event);
  }

  pushLiveVisitorsUpdate(
    storeId: string,
    count: number,
    active_products: string[],
  ) {
    this.server.to(`store:${storeId}`).emit('visitors:update', {
      count,
      active_products,
    });
  }
}
