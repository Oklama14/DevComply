import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { EncryptionService } from '../common/crypto/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, EncryptionService],
  controllers: [UsersController],
  exports: [UsersService], // para o AuthService poder injetar
})
export class UsersModule {}
