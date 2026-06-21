/**
 * 认证服务（Auth Service）
 *
 * 学习要点：
 * 1. 注册时使用 bcrypt 加密密码
 * 2. 登录时验证凭据并签发 JWT Token
 * 3. validateUser 方法被 Passport Strategy 调用
 * 4. JwtService 用于签发和验证 Token
 */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  // 注入 PrismaService 用于数据库操作，JwtService 用于 Token 签发
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   * 1. 检查用户名和邮箱是否已存在
   * 2. 使用 bcrypt 加密密码（saltRounds = 10）
   * 3. 创建用户记录
   * 4. 返回用户信息（不含密码）
   */
  async register(username: string, password: string, email: string) {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.username === username
          ? '用户名已存在'
          : '邮箱已被注册',
      );
    }

    // bcrypt 加密密码，saltRounds=10 是推荐的安全值
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
      },
    });

    // 返回用户信息时排除密码字段
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 验证用户凭据（被 LocalStrategy 调用）
   * 1. 根据用户名查找用户
   * 2. 使用 bcrypt.compare 比对密码
   * 3. 验证通过返回用户信息（不含密码）
   */
  async validateUser(username: string, password: string) {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 比对密码哈希值
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证通过，返回用户信息（排除密码）
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 用户登录 - 签发 JWT Token
   *
   * JWT Payload 包含：
   * - sub: 用户ID（标准字段，表示 token 的主体）
   * - username: 用户名
   *
   * 注意：不要在 payload 中存放敏感信息（如密码）
   * 因为 JWT 只是 base64 编码 + 签名，不是加密
   */
  async login(user: any) {
    // 构造 JWT payload
    const payload = {
      sub: user.id, // sub 是 JWT 标准字段，代表 subject（主体）
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      // 返回用户基本信息（不含密码）
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  /**
   * 根据 ID 查找用户（被 JwtStrategy 调用）
   * JWT 验证通过后，用 payload.sub（用户ID）查询完整用户信息
   */
  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const { password: _, ...result } = user;
    return result;
  }
}
