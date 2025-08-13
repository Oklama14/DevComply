    import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
    import { AuthService } from './auth.service';
    import { CreateUserDto } from '../users/dto/create-user.dto';

    @Controller('auth')
    export class AuthController {
      constructor(private authService: AuthService) {}

      @Post('register')
      register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
      }

      @HttpCode(HttpStatus.OK)
      @Post('login')
      login(@Body() loginDto: Record<string, any>) {
        return this.authService.login(loginDto.email, loginDto.senha);
      }
    }
    