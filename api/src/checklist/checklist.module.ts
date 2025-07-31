// Ficheiro: api/src/checklist/checklist.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { LgpdArticle } from './entities/lgpd-article.entity';
import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LgpdArticle,
      ChecklistQuestion,
      ChecklistResponse,
    ]), // Registre todas as entidades do checklist aqui
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}