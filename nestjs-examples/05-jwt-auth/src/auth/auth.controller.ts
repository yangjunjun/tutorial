/**
 * 认证控制器（Auth Controller）
 *
 * 学习要点：
 * 1. POST /auth/register - 用户注册
 * 2. POST /auth/login - 手动登录（直接调用 service）
 * 3. POST /auth/login-local - 使用 Local Strategy 登录
 * 4. GET /auth/profile - 使用 JWT Guard 保护的路由
 *
 * 两种登录方式的对比：
 * - 手动登录：Controller 直接调用 authService.validateUser
 * - Local Strategy 登录：通过 AuthGuard('local') 自动调用 LocalStrategy.validate
 */
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   * POST /auth/register
   *
   * 请求体示例：
   * { "username": "test", "password": "123456", "email": "test@example.com" }
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.username,
      registerDto.password,
      registerDto.email,
    );
    return {
      message: '注册成功',
      data: user,
    };
  }

  /**
   * 用户登录（手动验证方式）
   * POST /auth/login
   *
   * 流程：
   * 1. 接收用户名和密码
   * 2. 调用 validateUser 验证凭据
   * 3. 验证通过则签发 JWT Token
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // 手动验证用户凭据
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    // 签发 JWT Token
    return this.authService.login(user);
  }

  /**
   * 使用 Local Strategy 登录
   * POST /auth/login-local
   *
   * AuthGuard('local') 会自动：
   * 1. 从请求体中提取 username 和 password
   * 2. 调用 LocalStrategy.validate() 方法
   * 3. 验证通过后将用户信息挂载到 request.user
   */
  @UseGuards(AuthGuard('local'))
  @Post('login-local')
  async loginLocal(@Request() req) {
    // req.user 由 LocalStrategy.validate() 设置
    return this.authService.login(req.user);
  }

  /**
   * 获取当前用户信息（受保护路由）
   * GET /auth/profile
   *
   * JwtAuthGuard 会自动：
   * 1. 从 Authorization 头提取 Bearer Token
   * 2. 调用 JwtStrategy.validate() 验证 Token
   * 3. 验证通过后将用户信息挂载到 request.user
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // req.user 由 JwtStrategy.validate() 设置
    return {
      message: '认证成功！这是你的个人信息',
      data: req.user,
    };
  }
}
