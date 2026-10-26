import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { ProjectsService } from '../projects/projects.service';

describe('ChecklistController', () => {
  let controller: ChecklistController;
  const checklistService = { exportarDeclaracoes: jest.fn() };
  const projectsService = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistController],
      providers: [
        { provide: ChecklistService, useValue: checklistService },
        { provide: ProjectsService, useValue: projectsService },
      ],
    }).compile();
    controller = moduleRef.get(ChecklistController);
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  it('exporta as declaracoes so depois de conferir que o projeto e do usuario', async () => {
    projectsService.findOne.mockResolvedValue({ id: 7, nome: 'Loja' });
    checklistService.exportarDeclaracoes.mockResolvedValue({ schema: 'devcomply/declaracoes/1', itens: [] });

    const out = await controller.exportarDeclaracoes({ user: { userId: 3 } }, 7);

    expect(projectsService.findOne).toHaveBeenCalledWith(7, 3);
    expect(checklistService.exportarDeclaracoes).toHaveBeenCalledWith(7, 'Loja');
    expect(out.schema).toBe('devcomply/declaracoes/1');
  });

  it('projeto de outro usuario: nao exporta nada', async () => {
    projectsService.findOne.mockRejectedValue(new NotFoundException());

    await expect(controller.exportarDeclaracoes({ user: { userId: 3 } }, 99)).rejects.toThrow(NotFoundException);
    expect(checklistService.exportarDeclaracoes).not.toHaveBeenCalled();
  });
});
