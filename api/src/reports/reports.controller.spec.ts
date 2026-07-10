import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { AiService } from '@/services/ai.service';
import { ProjectsService } from '@/projects/projects.service';
import { UsersService } from '@/users/users.service';

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: AiService, useValue: {} },
        { provide: ProjectsService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();
    controller = moduleRef.get(ReportsController);
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });
});
