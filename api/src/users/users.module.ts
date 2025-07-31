import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity'; // Importe a entidade

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registre a entidade aqui
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}