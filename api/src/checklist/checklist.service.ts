import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LgpdArticle } from './entities/lgpd-article.entity';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(LgpdArticle)
    private readonly articleRepository: Repository<LgpdArticle>,
  ) {}

  // Método para buscar toda a estrutura do checklist
  async getChecklistStructure() {
    // Usamos 'relations' para que o TypeORM traga também as 'questoes' associadas a cada artigo
    const articlesWithQuestions = await this.articleRepository.find({
      relations: ['questoes'], // Corrigido de 'questions' para 'questoes'
    });
    
    // Mapeamos o resultado para o formato que o front-end espera
    return articlesWithQuestions.map(article => ({
      id: `cat_${article.id}`,
      name: article.titulo, // Corrigido de 'title' para 'titulo'
      items: article.questoes.map(question => ({ // Corrigido de 'questions' para 'questoes'
        id: `item_${question.id}`,
        text: question.pergunta, // Corrigido de 'question' para 'pergunta'
        details: article.descricao, // Corrigido de 'description' para 'descricao'
        article: article.artigo, // Corrigido de 'article' para 'artigo'
        checked: false, // O estado inicial será sempre falso
        implementationDetails: '',
        technicalDetails: '',
      })),
    }));
  }
}