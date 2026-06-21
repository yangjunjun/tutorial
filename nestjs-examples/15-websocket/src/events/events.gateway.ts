/**
 * 事件网关
 *
 * 演示 WebSocket 的高级功能：
 * 1. 服务端主动推送（无需客户端请求）
 * 2. 定时器驱动的推送
 * 3. 基础事件处理
 *
 * 服务端推送是 WebSocket 相比 HTTP 的核心优势：
 * - HTTP: 客户端必须主动请求（轮询）
 * - WebSocket: 服务端可以随时推送数据
 *
 * 典型应用场景：
 * - 实时股票价格推送
 * - 服务器监控数据
 * - 实时排行榜更新
 * - 系统公告
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

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  /** 定时器引用（用于在销毁时清理） */
  private timeInterval: NodeJS.Timeout;

  /** 连接计数 */
  private connectionCount = 0;

  afterInit() {
    this.logger.log('事件网关已初始化');

    /**
     * 服务端主动推送 - 定时器
     *
     * 每 5 秒向所有连接的客户端推送当前服务器时间。
     * 这展示了 WebSocket 的核心能力：
     * 服务端可以主动向客户端推送数据，无需客户端请求。
     *
     * 使用 setInterval 而不是 NestJS 的 SchedulerModule，
     * 以保持示例简洁。
     */
    this.timeInterval = setInterval(() => {
      const now = new Date();
      // 向所有客户端广播服务器时间
      this.server.emit('server_time', {
        time: now.toISOString(),
        timestamp: now.getTime(),
        message: '服务器时间推送（每5秒）',
      });
    }, 5000); // 每 5 秒

    this.logger.log('已启动服务器时间推送（每5秒）');
  }

  handleConnection(client: Socket) {
    this.connectionCount++;
    this.logger.log(
      `事件客户端连接: ${client.id} (当前连接数: ${this.connectionCount})`,
    );

    // 向新连接的客户端发送欢迎消息
    client.emit('welcome', {
      message: '欢迎连接到事件网关！',
      serverTime: new Date().toISOString(),
      connectionCount: this.connectionCount,
    });

    // 通知所有客户端连接数变化
    this.server.emit('connection_count', { count: this.connectionCount });
  }

  handleDisconnect(client: Socket) {
    this.connectionCount--;
    this.logger.log(
      `事件客户端断开: ${client.id} (当前连接数: ${this.connectionCount})`,
    );

    // 通知所有客户端连接数变化
    this.server.emit('connection_count', { count: this.connectionCount });
  }

  /**
   * 处理通用事件
   *
   * @SubscribeMessage('events')
   * - 监听名为 'events' 的客户端事件
   * - 可以接收任意格式的数据
   *
   * 返回值会自动作为响应发送给客户端。
   * 返回格式: { event: '原事件名', data: 返回值 }
   */
  @SubscribeMessage('events')
  handleEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.log(`收到事件: ${JSON.stringify(data)}`);

    // 返回处理结果给发送者
    return {
      event: 'events_response',
      data: {
        received: data,
        processedAt: new Date().toISOString(),
        message: '事件已处理',
      },
    };
  }

  /**
   * 客户端可以请求服务器向所有人广播自定义消息
   */
  @SubscribeMessage('broadcast')
  handleBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string },
  ) {
    this.logger.log(`广播请求: ${data.message}`);

    // 向所有客户端广播
    this.server.emit('broadcast_message', {
      message: data.message,
      from: client.id,
      timestamp: new Date().toISOString(),
    });
  }
}
