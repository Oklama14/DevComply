import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importação dos Módulos
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'devcomply_user',
      password: 'Direto00@', // Lembre-se de usar a sua senha
      database: 'devcomply_db',
      autoLoadEntities: true, // O NestJS vai encontrar suas entidades automaticamente
      synchronize: true,
    }),
    // Registro de todos os módulos da aplicação
    AuthModule,
    UsersModule,
    ProjectsModule,
    ChecklistModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}