import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(userId: number, createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      usuario: { id: userId },
    });
    return this.projectRepository.save(project);
  }

  async findAll(userId: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: { usuario: { id: userId } },
    });
  }

  async findOne(id: number, userId: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, usuario: { id: userId } },
    });
    if (!project) {
      throw new NotFoundException(`Projeto com ID #${id} não encontrado ou não pertence a este usuário.`);
    }
    return project;
  }

  async update(id: number, userId: number, dto: UpdateProjectDto) {
    const existing = await this.findOne(id, userId); // Garante que pertence ao usuário
    
    const project = await this.projectRepository.preload({ id: existing.id, ...dto });
    if (!project) throw new NotFoundException(`Projeto com ID #${id} não encontrado para atualização.`);
    return this.projectRepository.save(project);
  }

  async remove(id: number, userId: number): Promise<void> {
    const project = await this.findOne(id, userId); // Garante que pertence ao usuário
    await this.projectRepository.remove(project);
  }
}
