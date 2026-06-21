/**
 * 作者服务
 *
 * 管理作者数据的 CRUD 操作。
 * 使用内存存储，专注于 GraphQL 集成。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Author } from './models/author.model';
import { CreateAuthorInput } from './dto/create-author.input';

@Injectable()
export class AuthorsService {
  /** 内存存储 */
  private authors: Author[] = [
    // 预置一些示例数据
    { id: 1, name: '张三', email: 'zhangsan@example.com' },
    { id: 2, name: '李四', email: 'lisi@example.com' },
  ];

  /** ID 计数器 */
  private idCounter = 3;

  /**
   * 获取所有作者
   */
  findAll(): Author[] {
    return this.authors;
  }

  /**
   * 根据 ID 获取作者
   * @param id - 作者 ID
   */
  findOne(id: number): Author {
    const author = this.authors.find((a) => a.id === id);
    if (!author) {
      throw new NotFoundException(`作者 #${id} 不存在`);
    }
    return author;
  }

  /**
   * 创建作者
   * @param input - 创建作者输入数据
   */
  create(input: CreateAuthorInput): Author {
    const author: Author = {
      id: this.idCounter++,
      name: input.name,
      email: input.email,
    };
    this.authors.push(author);
    return author;
  }

  /**
   * 根据作者 ID 列表批量获取
   * 用于 @ResolveField 中解析文章关联的作者
   */
  findByIds(ids: number[]): Author[] {
    return this.authors.filter((a) => ids.includes(a.id));
  }
}
