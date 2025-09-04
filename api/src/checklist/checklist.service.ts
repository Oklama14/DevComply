import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LgpdArticle } from './entities/lgpd-article.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { SaveChecklistDto } from './dto/save-checklist.dto';
import { ChecklistQuestion } from './entities/checklist-question.entity';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(LgpdArticle)
    private readonly articleRepository: Repository<LgpdArticle>,
    @InjectRepository(ChecklistResponse)
    private readonly responseRepository: Repository<ChecklistResponse>,
  ) {}

  /**
   * Busca toda a estrutura de artigos e perguntas do checklist.
   */
  async getChecklistStructure() {
    const articles = await this.articleRepository.find({
      relations: ['questoes'], // Carrega as perguntas relacionadas a cada artigo
      order: {
        id: 'ASC', // Garante uma ordem consistente
      },
    });

    // Mapeia os dados para o formato que o front-end espera
    return articles.map(article => ({
      id: `category_${article.id}`,
      title: article.titulo,
      description: article.descricao,
      items: article.questoes.map(question => ({
        id: `item_${question.id}`,
        text: question.pergunta,
        helpText: `Ref: ${article.artigo}`, // Exemplo de texto de ajuda
        checked: false, // Valor padrão
        implementationDetails: '', // Valor padrão
        technicalDetails: '', // Valor padrão
      })),
    }));
  }

  /**
   * Salva as respostas do checklist para um projeto específico.
   * @param projectId - O ID do projeto.
   * @param data - Os dados das respostas enviadas pelo front-end.
   */
  async saveChecklistResponses(projectId: number, data: SaveChecklistDto) {
    for (const item of data.items) {
      // Extrai o ID numérico da pergunta a partir do ID do item (ex: "item_15")
      const questionId = parseInt(item.id.replace('item_', ''), 10);

      // Procura se já existe uma resposta para esta pergunta e este projeto
      let response = await this.responseRepository.findOne({
        where: { projeto: { id: projectId }, pergunta: { id: questionId } },
      });

      // Se não existir, cria uma nova instância
      if (!response) {
        response = this.responseRepository.create({
          projeto: { id: projectId },
          pergunta: { id: questionId },
        });
      }

      // Atualiza os dados da resposta com as informações recebidas
      response.resposta = item.implementationDetails; // Adapte conforme necessário
      response.conformidade = item.checked;
      
      // Salva a resposta no banco de dados (cria uma nova ou atualiza a existente)
      await this.responseRepository.save(response);
    }

    return { message: 'Progresso salvo com sucesso!' };
  }
  
  /**
   * Busca as respostas salvas de um checklist para um projeto específico.
   * @param projectId - O ID do projeto.
   */
  async getChecklistResponses(projectId: number) {
    return this.responseRepository.find({
      where: { projeto: { id: projectId } },
      relations: ['pergunta'], // Carrega os detalhes da pergunta relacionada para referência
    });
  }
}