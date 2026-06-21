/**
 * 聊天服务
 *
 * 管理聊天相关的状态：房间、消息历史、在线用户。
 * 使用内存存储，适合演示用途。
 *
 * 在生产环境中，应该使用：
 * - Redis 存储在线用户状态（支持多实例部署）
 * - 数据库存储消息历史
 * - 消息队列处理高并发
 */
import { Injectable, Logger } from '@nestjs/common';
import { MessageDto, MessageType } from './dto/message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  /** 消息历史 - roomId -> messages[] */
  private roomMessages: Map<string, MessageDto[]> = new Map();

  /** 在线用户 - roomId -> Set<username> */
  private roomUsers: Map<string, Set<string>> = new Map();

  /** 最大保存消息数 */
  private readonly MAX_MESSAGES = 50;

  /**
   * 添加用户到房间
   * @param roomId - 房间 ID
   * @param username - 用户名
   */
  addUserToRoom(roomId: string, username: string): void {
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId).add(username);
    this.logger.log(`用户 ${username} 加入房间 ${roomId}`);
  }

  /**
   * 从房间移除用户
   * @param roomId - 房间 ID
   * @param username - 用户名
   */
  removeUserFromRoom(roomId: string, username: string): void {
    const users = this.roomUsers.get(roomId);
    if (users) {
      users.delete(username);
      this.logger.log(`用户 ${username} 离开房间 ${roomId}`);

      // 如果房间没有用户了，清理房间
      if (users.size === 0) {
        this.roomUsers.delete(roomId);
      }
    }
  }

  /**
   * 获取房间在线用户
   * @param roomId - 房间 ID
   * @returns 在线用户名列表
   */
  getOnlineUsers(roomId: string): string[] {
    const users = this.roomUsers.get(roomId);
    return users ? Array.from(users) : [];
  }

  /**
   * 保存消息到历史
   * @param message - 消息数据
   */
  saveMessage(message: MessageDto): void {
    if (!this.roomMessages.has(message.room)) {
      this.roomMessages.set(message.room, []);
    }

    const messages = this.roomMessages.get(message.room);
    message.timestamp = new Date();
    messages.push(message);

    // 只保留最近的 N 条消息
    if (messages.length > this.MAX_MESSAGES) {
      messages.shift(); // 移除最旧的消息
    }
  }

  /**
   * 获取房间消息历史
   * @param roomId - 房间 ID
   * @returns 最近的消息列表
   */
  getRoomHistory(roomId: string): MessageDto[] {
    return this.roomMessages.get(roomId) || [];
  }

  /**
   * 创建系统消息
   * @param roomId - 房间 ID
   * @param content - 消息内容
   */
  createSystemMessage(roomId: string, content: string): MessageDto {
    return {
      room: roomId,
      user: '系统',
      content,
      type: MessageType.SYSTEM,
      timestamp: new Date(),
    };
  }

  /**
   * 获取所有房间列表
   */
  getAllRooms(): { id: string; userCount: number }[] {
    const rooms: { id: string; userCount: number }[] = [];
    this.roomUsers.forEach((users, roomId) => {
      rooms.push({ id: roomId, userCount: users.size });
    });
    return rooms;
  }
}
