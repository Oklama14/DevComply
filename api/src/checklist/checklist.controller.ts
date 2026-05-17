import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { SaveChecklistDto } from './dto/save-checklist.dto';
import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { ChecklistCategoryDto } from './dto/checklist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';

@UseGuards(JwtAuthGuard)
@Controller('checklist')
export class ChecklistController {
  constructor(
    private readonly checklistService: ChecklistService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get('questions')
  async getQuestions(): Promise<ChecklistCategoryDto[]> {
    return this.checklistService.getStructuredQuestions();
  }

  // 📹 POST /checklist/project/:id - Salva respostas do checklist para um projeto
  @Post('project/:id')
  async saveChecklistResponses(
    @Request() req,
    @Param('id', ParseIntPipe) projectId: number,
    @Body() saveChecklistDtos: SaveChecklistDto[],
  ): Promise<ChecklistResponse[]> {
    // Verifica se o projeto existe e pertence ao usuário autenticado
    await this.projectsService.findOne(projectId, req.user.userId);

    return this.checklistService.saveChecklistResponses(
      projectId,
      saveChecklistDtos,
    );
  }

  // 📹 GET /checklist/project/:id - Busca respostas do checklist por projeto
  @Get('project/:id')
  async getChecklistByProject(
    @Request() req,
    @Param('id', ParseIntPipe) projectId: number,
  ): Promise<ChecklistResponse[]> {
    // Verifica se o projeto existe e pertence ao usuário autenticado
    await this.projectsService.findOne(projectId, req.user.userId);

    return this.checklistService.findByProjectId(projectId);
  }
}