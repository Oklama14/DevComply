    import { Controller, Get, UseGuards } from '@nestjs/common';
    import { ChecklistService } from './checklist.service';
    import { AuthGuard } from '@nestjs/passport'; // Assumindo que o AuthGuard está configurado globalmente ou no módulo

    @Controller('checklist')
    // @UseGuards(AuthGuard('jwt')) // Descomente para proteger esta rota
    export class ChecklistController {
      constructor(private readonly checklistService: ChecklistService) {}

      @Get()
      getChecklistStructure() {
        return this.checklistService.getChecklistStructure();
      }
    }
    