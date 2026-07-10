import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChecklistService } from './checklist.service';
import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { LgpdArticle } from './entities/lgpd-article.entity';

describe('ChecklistService', () => {
  let service: ChecklistService;
  const repo = () => ({ find: jest.fn(), findOne: jest.fn(), save: jest.fn(), count: jest.fn() });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        { provide: getRepositoryToken(ChecklistQuestion), useValue: repo() },
        { provide: getRepositoryToken(ChecklistResponse), useValue: repo() },
        { provide: getRepositoryToken(LgpdArticle), useValue: repo() },
      ],
    }).compile();
    service = moduleRef.get(ChecklistService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });
});
