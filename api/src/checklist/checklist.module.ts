import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { LgpdArticle } from './entities/lgpd-article.entity';
import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LgpdArticle,
      ChecklistQuestion,
      ChecklistResponse,
    ]), // Registre todas as entidades do checklist aqui
    ProjectsModule,
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],

})
export class ChecklistModule {}