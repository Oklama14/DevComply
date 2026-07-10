    import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
    import { Throttle } from '@nestjs/throttler';
    import { AuthService } from './auth.service';
    import { CreateUserDto } from '../users/dto/create-user.dto';

    @Controller('auth')
    export class AuthController {
      constructor(private authService: AuthService) {}

      @Throttle({ default: { limit: 5, ttl: 60000 } })
      @Post('register')
      register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
      }

      @Throttle({ default: { limit: 5, ttl: 60000 } })
      @HttpCode(HttpStatus.OK)
      @Post('login')
      login(@Body() loginDto: Record<string, any>) {
        return this.authService.login(loginDto.email, loginDto.senha);
      }
    }
    