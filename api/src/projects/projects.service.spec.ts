import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const repo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectsService, { provide: getRepositoryToken(Project), useValue: repo }],
    }).compile();
    service = moduleRef.get(ProjectsService);
  });

  it('findOne lanca NotFound quando nao pertence ao usuario', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(5, 99)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5, usuario: { id: 99 } } }),
    );
  });

  it('findOne retorna o projeto quando existe e pertence ao usuario', async () => {
    const proj = { id: 5, nome: 'P' };
    repo.findOne.mockResolvedValue(proj);
    await expect(service.findOne(5, 1)).resolves.toBe(proj);
  });
});
