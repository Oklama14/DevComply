import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { ProjectsService } from '../projects/projects.service';

describe('ChecklistController', () => {
  let controller: ChecklistController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistController],
      providers: [
        { provide: ChecklistService, useValue: {} },
        { provide: ProjectsService, useValue: {} },
      ],
    }).compile();
    controller = moduleRef.get(ChecklistController);
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });
});
