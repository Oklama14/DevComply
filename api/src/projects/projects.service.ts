import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto'; // 1. Importe o DTO de update

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });
    if (!project) {
      throw new NotFoundException(`Projeto com ID #${id} não encontrado.`);
    }
    return project;
  }

  // 2. Adicione o método para ATUALIZAR um projeto
  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    // O método 'preload' busca o projeto pelo ID e mescla os novos dados do DTO.
    // Se o projeto não existir, ele retorna undefined.
    const project = await this.projectRepository.preload({
      id: id,
      ...updateProjectDto,
    });

    if (!project) {
      throw new NotFoundException(`Projeto com ID #${id} não encontrado para atualização.`);
    }

    // Salva a entidade atualizada no banco de dados.
    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }
}
