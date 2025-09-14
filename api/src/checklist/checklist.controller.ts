import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { SaveChecklistDto } from './dto/save-checklist.dto';
import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { ChecklistCategoryDto } from './dto/checklist.dto';


@Controller('checklist')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

@Get('questions')
async getQuestions(): Promise<ChecklistCategoryDto[]> {
  return this.checklistService.getStructuredQuestions();
}

  // 📹 POST /checklist/project/:id - Salva respostas do checklist para um projeto
  @Post('project/:id')
  async saveChecklistResponses(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() saveChecklistDtos: SaveChecklistDto[],
  ): Promise<ChecklistResponse[]> {
    return this.checklistService.saveChecklistResponses(
      projectId,
      saveChecklistDtos,
    );
  }

  // 📹 GET /checklist/project/:id - Busca respostas do checklist por projeto
  @Get('project/:id')
  async getChecklistByProject(
    @Param('id', ParseIntPipe) projectId: number,
  ): Promise<ChecklistResponse[]> {
    return this.checklistService.findByProjectId(projectId);
  }
}