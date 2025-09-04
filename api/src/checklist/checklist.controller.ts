import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { AuthGuard } from '@nestjs/passport';
import { SaveChecklistDto } from './dto/save-checklist.dto';

@Controller('checklist')
@UseGuards(AuthGuard('jwt'))
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get()
  getChecklist() {
    return this.checklistService.getChecklistStructure();
  }
  
  // Novo endpoint para buscar as respostas
  @Get('responses/:projectId')
  getResponses(@Param('projectId') projectId: number) {
    return this.checklistService.getChecklistResponses(projectId);
  }

  @Post('responses/:projectId')
  saveResponses(
    @Param('projectId') projectId: number,
    @Body() saveChecklistDto: SaveChecklistDto,
  ) {
    return this.checklistService.saveChecklistResponses(projectId, saveChecklistDto);
  }
}