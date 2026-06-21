/**
 * Todo 接口定义
 *
 * 定义 Todo 实体的类型结构。
 * 接口在运行时不存在，仅用于 TypeScript 编译时类型检查。
 */

/** 优先级枚举 */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/** Todo 实体接口 */
export interface Todo {
  /** 唯一标识符 */
  id: string;
  /** 标题 */
  title: string;
  /** 描述（可选） */
  description?: string;
  /** 优先级 */
  priority: Priority;
  /** 是否已完成 */
  completed: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/** Todo 统计信息接口 */
export interface TodoStats {
  /** 总数 */
  total: number;
  /** 已完成数 */
  completed: number;
  /** 待处理数 */
  pending: number;
  /** 按优先级分组统计 */
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

/** Todo 过滤条件接口 */
export interface TodoFilter {
  /** 按完成状态过滤 */
  completed?: boolean;
  /** 按优先级过滤 */
  priority?: Priority;
}
