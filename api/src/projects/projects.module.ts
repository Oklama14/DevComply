// Ficheiro: api/src/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity'; // Importe a entidade Project

@Module({
  imports: [TypeOrmModule.forFeature([Project])], // Registre a entidade Project aqui
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}