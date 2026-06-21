/**
 * 通知网关
 *
 * 演示 WebSocket 的定向推送功能。
 * 与聊天网关不同，通知网关专注于向特定用户推送消息。
 *
 * 关键概念 - 用户与 Socket 映射：
 *
 * 为了实现定向推送，需要维护 userId -> socketId 的映射关系。
 * 当需要通知某个用户时，通过映射找到对应的 socket，然后发送消息。
 *
 * 在多实例部署时，需要使用 Redis Pub/Sub 来跨实例传递消息。
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notification',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  /**
   * 用户 -> Socket 映射
   *
   * key: userId
   * value: Socket.io client ID (socket.id)
   *
   * 这个映射让我们能够找到特定用户的连接，
   * 实现定向推送通知。
   */
  private userSocketMap: Map<string, string> = new Map();

  /**
   * Socket -> 用户 反向映射
   * 用于在断开连接时清理用户映射
   */
  private socketUserMap: Map<string, string> = new Map();

  constructor(private readonly notificationService: NotificationService) {}

  afterInit() {
    this.logger.log('通知网关已初始化');
  }

  handleConnection(client: Socket) {
    this.logger.log(`通知客户端连接: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`通知客户端断开: ${client.id}`);
    // 清理映射
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
    }
  }

  /**
   * 注册用户连接
   *
   * 客户端连接后需要发送 register 事件，
   * 告诉服务端当前用户的身份。
   * 这样才能实现后续的定向推送。
   *
   * 客户端代码：
   * socket.emit('register', { userId: 'user-123' })
   */
  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;

    this.logger.log(`注册用户映射: ${userId} -> ${client.id}`);

    // 建立双向映射
    this.userSocketMap.set(userId, client.id);
    this.socketUserMap.set(client.id, userId);

    // 发送未读通知数量
    const unreadCount = this.notificationService.getUnreadCount(userId);
    client.emit('unread_count', { count: unreadCount });

    return { event: 'register_success', data: { userId } };
  }

  /**
   * 向特定用户发送通知
   *
   * 这个方法可以被其他服务调用（如 HTTP 控制器），
   * 实现"后端主动推送通知给特定用户"。
   *
   * @param userId - 目标用户 ID
   * @param message - 通知消息
   */
  notifyUser(userId: string, message: string): boolean {
    const socketId = this.userSocketMap.get(userId);
    if (!socketId) {
      this.logger.warn(`用户 ${userId} 不在线，无法推送通知`);
      return false;
    }

    // 创建通知记录
    const notification = this.notificationService.createNotification(
      userId,
      message,
    );

    // 向特定 socket 发送消息
    this.server.to(socketId).emit('notification', notification);
    this.logger.log(`已推送通知给用户 ${userId}: ${message}`);
    return true;
  }

  /**
   * 向所有在线用户广播通知
   *
   * @param message - 通知消息
   */
  broadcastAll(message: string): void {
    const notification = {
      id: `broadcast-${Date.now()}`,
      message,
      createdAt: new Date(),
    };

    // 向整个命名空间广播
    this.server.emit('broadcast_notification', notification);
    this.logger.log(`广播通知给所有用户: ${message}`);
  }

  /**
   * 客户端标记通知为已读
   */
  @SubscribeMessage('mark_read')
  handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const success = this.notificationService.markAsRead(data.notificationId);
    return { event: 'mark_read_result', data: { success } };
  }
}
