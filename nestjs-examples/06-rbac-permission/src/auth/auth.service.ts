/**
 * 认证服务
 *
 * 与 05-jwt-auth 类似，但：
 * 1. 注册时支持指定角色
 * 2. JWT payload 中包含角色信息
 * 3. 返回的用户对象包含 role 字段
 */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户注册（支持角色）
   */
  async register(
    username: string,
    password: string,
    email: string,
    role?: Role,
  ) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        role: role || Role.USER, // 默认角色为 USER
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 验证用户凭据
   */
  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 签发 JWT Token
   * payload 中包含角色信息，供 RolesGuard 使用
   */
  async login(user: any) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role, // 角色信息包含在 Token 中
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
