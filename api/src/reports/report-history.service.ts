import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { Relatorio } from './relatorio.types';
import {
  ResumoRelatorio,
  guardarRelatorio,
  restaurarRelatorio,
  resumirRelatorio,
} from './relatorio-historico';

/** Linha da lista do historico (sem o conteudo do relatorio). */
export interface ItemHistorico {
  id: number;
  criadoEm: Date;
  modelo: string | null;
  pontuacao: number | null;
  resumo: ResumoRelatorio | null;
}

/**
 * Historico de relatorios por projeto. Quem chama ja conferiu que o projeto e do
 * usuario; aqui toda consulta ainda filtra pelo projeto, para que o id de um
 * relatorio nunca alcance o de outro projeto.
 */
@Injectable()
export class ReportHistoryService {
  constructor(@InjectRepository(Report) private readonly repo: Repository<Report>) {}

  async salvar(projetoId: number, relatorio: Relatorio): Promise<Report> {
    const { pontuacao, resumo } = resumirRelatorio(relatorio);
    const registro = this.repo.create({
      projetoId,
      status: 'gerado',
      pontuacao,
      modelo: relatorio.modelo?.slice(0, 80) ?? null,
      resumo,
      conteudo: guardarRelatorio(relatorio),
    });
    return this.repo.save(registro);
  }

  /** Mais recente primeiro. */
  async listar(projetoId: number): Promise<ItemHistorico[]> {
    const linhas = await this.repo.find({
      where: { projetoId },
      order: { criadoEm: 'DESC', id: 'DESC' },
    });
    return linhas.map((r) => ({
      id: r.id,
      criadoEm: r.criadoEm,
      modelo: r.modelo,
      pontuacao: r.pontuacao,
      resumo: r.resumo,
    }));
  }

  /** O relatorio guardado, pronto para virar PDF de novo. */
  async buscar(projetoId: number, id: number): Promise<Relatorio> {
    const registro = await this.repo.findOne({
      where: { id, projetoId },
      select: { id: true, conteudo: true },
    });
    if (!registro?.conteudo) {
      throw new NotFoundException('Relatório não encontrado no histórico deste projeto.');
    }
    return restaurarRelatorio(registro.conteudo);
  }

  async remover(projetoId: number, id: number): Promise<void> {
    const { affected } = await this.repo.delete({ id, projetoId });
    if (!affected) {
      throw new NotFoundException('Relatório não encontrado no histórico deste projeto.');
    }
  }
}
