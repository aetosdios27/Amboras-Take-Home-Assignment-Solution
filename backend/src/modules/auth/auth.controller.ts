import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('/login')
  async login(@Body() dto: LoginDto) {
    const payload = { sub: dto.userId, storeId: dto.storeId };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user_id: dto.userId,
      store_id: dto.storeId,
    };
  }
}
