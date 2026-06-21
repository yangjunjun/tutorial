/**
 * 聊天网关 (Chat Gateway)
 *
 * WebSocket 网关是 NestJS 处理实时通信的核心组件。
 * 它封装了 Socket.io 的服务端逻辑。
 *
 * =============================================
 * WebSocket 网关生命周期
 * =============================================
 *
 * 1. afterInit(server)
 *    - 网关初始化完成后调用
 *    - 此时 server 实例已经创建
 *    - 适合做一次性初始化工作
 *
 * 2. handleConnection(client)
 *    - 新的客户端连接时调用
 *    - client 是 Socket.io 的 Socket 实例
 *    - 适合：记录连接、认证验证、初始化用户状态
 *
 * 3. @SubscribeMessage('event') 方法
 *    - 客户端发送消息时触发对应方法
 *    - 类似 HTTP 控制器中的路由处理
 *
 * 4. handleDisconnect(client)
 *    - 客户端断开连接时调用
 *    - 适合：清理资源、通知其他用户
 *
 * =============================================
 * @WebSocketGateway 配置
 * =============================================
 *
 * - namespace: 命名空间，隔离不同功能的 WebSocket
 * - cors: 跨域配置
 * - transports: 允许的传输方式 ['websocket', 'polling']
 * - path: 自定义路径
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
import { ChatService } from './chat.service';
import { MessageDto, MessageType } from './dto/message.dto';

/**
 * @WebSocketGateway 装饰器配置
 *
 * - { cors: true } 允许跨域连接
 * - { namespace: '/chat' } 设置命名空间
 *   客户端连接时使用: io('http://localhost:3000/chat')
 */
@WebSocketGateway({
  cors: {
    origin: '*', // 允许所有来源（生产环境应限制）
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  /**
   * @WebSocketServer()
   * 注入 Socket.io Server 实例。
   * 通过 server 可以向所有客户端广播消息。
   *
   * 注意：这个属性会在网关初始化后被注入，
   * 在构造函数中访问会是 undefined。
   */
  @WebSocketServer()
  server: Server;

  /** 客户端映射 - socketId -> { username, room } */
  private clients: Map<string, { username: string; room: string }> = new Map();

  constructor(private readonly chatService: ChatService) {}

  // =============================================
  // 生命周期钩子
  // =============================================

  /**
   * afterInit - 网关初始化完成
   *
   * 在这个时间点：
   * - Server 实例已创建
   * - 可以开始监听事件
   * - 适合做全局初始化
   */
  afterInit(server: Server) {
    this.logger.log('聊天网关已初始化');
    this.logger.log('WebSocket 服务器已就绪');
  }

  /**
   * handleConnection - 新客户端连接
   *
   * 每当有新的客户端连接到 /chat 命名空间时触发。
   *
   * @param client - 连接的客户端 Socket 实例
   *
   * 常见用途：
   * - 验证身份（从 cookie/header 中提取 token）
   * - 记录在线用户
   * - 发送欢迎消息
   */
  handleConnection(client: Socket) {
    this.logger.log(`新客户端连接: ${client.id}`);
    this.logger.log(`当前连接数: ${this.server.sockets?.size || 0}`);
  }

  /**
   * handleDisconnect - 客户端断开连接
   *
   * 当客户端断开连接时触发。
   * 注意：断开原因可能是：
   * - 客户端主动断开
   * - 网络中断
   * - 服务器主动断开
   *
   * @param client - 断开的客户端 Socket 实例
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`客户端断开连接: ${client.id}`);

    // 清理客户端状态
    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      const { username, room } = clientInfo;

      // 从房间移除用户
      this.chatService.removeUserFromRoom(room, username);
      client.leave(room);

      // 通知房间内其他用户
      this.server.to(room).emit('user_left', {
        user: username,
        message: `${username} 离开了聊天室`,
        onlineUsers: this.chatService.getOnlineUsers(room),
      });

      this.clients.delete(client.id);
    }
  }

  // =============================================
  // 消息处理
  // =============================================

  /**
   * @SubscribeMessage('join_room')
   * 处理加入房间的请求
   *
   * 客户端发送：
   * socket.emit('join_room', { room: 'general', user: '张三' })
   *
   * 服务端处理：
   * 1. 将客户端加入 Socket.io 房间
   * 2. 记录用户信息
   * 3. 通知房间内其他用户
   * 4. 发送历史消息给新用户
   *
   * @param client - 发送消息的客户端
   * @param data - 消息数据 { room, user }
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; user: string },
  ) {
    const { room, user } = data;

    this.logger.log(`用户 ${user} 加入房间 ${room}`);

    // 如果用户之前在其他房间，先离开
    const existingInfo = this.clients.get(client.id);
    if (existingInfo && existingInfo.room) {
      client.leave(existingInfo.room);
      this.chatService.removeUserFromRoom(existingInfo.room, existingInfo.user);
    }

    // 加入新房间
    client.join(room);
    this.clients.set(client.id, { username: user, room });
    this.chatService.addUserToRoom(room, user);

    // 创建系统消息
    const systemMsg = this.chatService.createSystemMessage(
      room,
      `${user} 加入了聊天室`,
    );
    this.chatService.saveMessage(systemMsg);

    // 通知房间内所有人
    this.server.to(room).emit('user_joined', {
      user,
      message: systemMsg.content,
      onlineUsers: this.chatService.getOnlineUsers(room),
    });

    // 发送历史消息给新加入的用户
    const history = this.chatService.getRoomHistory(room);
    client.emit('room_history', history);

    return { event: 'join_room_success', data: { room, user } };
  }

  /**
   * @SubscribeMessage('leave_room')
   * 处理离开房间的请求
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; user: string },
  ) {
    const { room, user } = data;

    this.logger.log(`用户 ${user} 离开房间 ${room}`);

    // 离开房间
    client.leave(room);
    this.chatService.removeUserFromRoom(room, user);

    // 创建系统消息
    const systemMsg = this.chatService.createSystemMessage(
      room,
      `${user} 离开了聊天室`,
    );
    this.chatService.saveMessage(systemMsg);

    // 通知房间内其他人
    this.server.to(room).emit('user_left', {
      user,
      message: systemMsg.content,
      onlineUsers: this.chatService.getOnlineUsers(room),
    });

    this.clients.delete(client.id);
  }

  /**
   * @SubscribeMessage('message')
   * 处理聊天消息
   *
   * 流程：
   * 1. 接收客户端发送的消息
   * 2. 保存到历史记录
   * 3. 广播给房间内的所有人（包括发送者）
   *
   * @param client - 发送消息的客户端
   * @param data - 消息数据 { room, user, content, type }
   */
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageDto,
  ) {
    this.logger.log(`[${data.room}] ${data.user}: ${data.content}`);

    // 设置消息时间戳
    data.timestamp = new Date();

    // 保存到消息历史
    this.chatService.saveMessage(data);

    /**
     * 广播消息给房间内所有人
     *
     * this.server.to(room).emit()
     * - 向指定房间的所有连接的客户端发送消息
     * - 包括发送者自己
     *
     * 其他广播方式：
     * - client.broadcast.to(room).emit() - 发给房间内除发送者外的所有人
     * - this.server.emit() - 发给所有连接的客户端
     * - client.emit() - 只发给发送者
     */
    this.server.to(data.room).emit('message', data);
  }

  /**
   * @SubscribeMessage('typing')
   * 处理"正在输入"指示器
   *
   * 当用户在输入消息时，前端可以发送 typing 事件，
   * 让房间内的其他用户看到 "xxx 正在输入..." 提示。
   *
   * 使用 broadcast 而不是 server.to()，
   * 这样只通知其他人，不通知发送者自己。
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; user: string; isTyping: boolean },
  ) {
    /**
     * client.broadcast.to(room).emit()
     * - broadcast: 排除发送者自己
     * - to(room): 只发给指定房间
     * - 结果: 发给房间内除发送者外的所有人
     */
    client.broadcast.to(data.room).emit('typing', {
      user: data.user,
      isTyping: data.isTyping,
    });
  }
}
