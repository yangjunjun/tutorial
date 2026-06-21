/**
 * 消息 DTO
 *
 * 定义聊天消息的数据结构。
 * 用于验证从客户端接收到的消息格式。
 */

/** 消息类型枚举 */
export enum MessageType {
  /** 文本消息 */
  TEXT = 'text',
  /** 图片消息 */
  IMAGE = 'image',
  /** 系统消息（如用户加入/离开） */
  SYSTEM = 'system',
}

/** 消息 DTO */
export class MessageDto {
  /** 房间 ID */
  room: string;
  /** 发送者用户名 */
  user: string;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  type: MessageType = MessageType.TEXT;
  /** 发送时间 */
  timestamp?: Date;
}

/** 加入/离开房间 DTO */
export class JoinRoomDto {
  /** 房间 ID */
  room: string;
  /** 用户名 */
  user: string;
}
