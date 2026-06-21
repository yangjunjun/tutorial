/**
 * 客户端接口定义
 *
 * 定义连接的客户端数据结构。
 * 用于管理在线用户和客户端映射关系。
 */

/** 连接的客户端信息 */
export interface ConnectedClient {
  /** Socket.io 客户端 ID */
  socketId: string;
  /** 用户名 */
  username: string;
  /** 当前所在房间 */
  currentRoom?: string;
  /** 连接时间 */
  connectedAt: Date;
}

/** 房间信息 */
export interface RoomInfo {
  /** 房间 ID */
  id: string;
  /** 房间名称 */
  name: string;
  /** 在线用户列表 */
  users: string[];
  /** 消息历史（最多保存最近50条） */
  messageCount: number;
}
