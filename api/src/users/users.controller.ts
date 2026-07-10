import { Controller, Body, Patch, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Perfil do usuario autenticado (id vem do token, nunca da URL -> sem IDOR).
  @Get('me')
  me(@Request() req) {
    return this.users.findOne(req.user.userId);
  }

  @Patch('me/profile')
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.userId, dto);
  }

  @Patch('me/password')
  changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(req.user.userId, dto);
  }
}
