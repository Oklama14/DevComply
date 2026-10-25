import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
  UseGuards,
  Request,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AiService, IaIndisponivelError } from '@/services/ai.service';
import { FrontCategory } from '@/types/ai.types';
import { AvaliacaoIA } from './relatorio.types';
import { itensDeEntrada, montarRelatorio } from './montar-relatorio';
import { gerarRelatorioPdf } from './relatorio-pdf';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ProjectsService } from '@/projects/projects.service';
import { UsersService } from '@/users/users.service';
import { ReportQuotaService, ReportRateLimitGuard } from './report-rate-limit.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly ai: AiService,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly quota: ReportQuotaService,
  ) {}

  // ====== 1) multipart/form-data: arquivo JSON ======
  @Post('checklist')
  @UseGuards(ReportRateLimitGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadChecklist(
    @Request() req,
    @UploadedFile() file: any,
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Arquivo ausente (campo "file").');
    }

    if (body?.projectId) {
      // Verifica se o projeto existe e pertence ao usuário autenticado
      await this.projectsService.findOne(Number(body.projectId), req.user.userId);
    }

    let payload: FrontCategory[];
    try {
      const text = file.buffer.toString('utf8');
      payload = JSON.parse(text);
    } catch (e: any) {
      throw new BadRequestException('JSON inválido no arquivo enviado.');
    }

    const apiKey = (await this.usersService.getGeminiKey(req.user.userId)) ?? undefined;
    return this.generateAndSendPdf(payload, res, body?.projectId, body?.projectName, apiKey, req.user.userId);
  }


  // ====== 2) application/json: JSON direto ======
  @Post('checklist-json')
  @UseGuards(ReportRateLimitGuard)
  async uploadChecklistJson(
    @Request() req,
    @Body() payload: FrontCategory[],
    @Res() res: Response,
  ) {
    if (!Array.isArray(payload)) {
      throw new BadRequestException('Payload deve ser um array de categorias.');
    }
    const apiKey = (await this.usersService.getGeminiKey(req.user.userId)) ?? undefined;
    return this.generateAndSendPdf(payload, res, undefined, undefined, apiKey, req.user.userId);
  }

  // ====== helper: chama IA e gera o PDF ======
  private async generateAndSendPdf(
    categories: FrontCategory[],
    res: Response,
    projectId?: string | number,
    projectName?: string,
    apiKey?: string,
    userId?: number,
  ) {
    const entrada = itensDeEntrada(categories);
    const marcados = entrada.filter((i) => i.marcado);
    if (!marcados.length) {
      throw new BadRequestException('Marque ao menos um item do checklist para gerar o relatório.');
    }
    const naoMarcados = entrada.filter((i) => !i.marcado);

    // Uma chamada para o checklist inteiro. Os itens nao marcados nao sao avaliados:
    // entram como "Nao atende" com a recomendacao do LGPD-Check.
    let avaliacao: AvaliacaoIA;
    let modelo: string;
    try {
      ({ avaliacao, modelo } = await this.ai.avaliarChecklist(marcados, naoMarcados, apiKey, projectName));
    } catch (err) {
      const erro =
        err instanceof IaIndisponivelError
          ? err
          : new IaIndisponivelError('Não foi possível gerar a análise pela IA. Tente novamente.', 'outro');
      this.logger.warn(`IA falhou no relatório (projeto ${projectId ?? '-'}): ${erro.motivo} - ${erro.message}`);
      // Relatorio que nao saiu nao conta no limite de relatorios por hora.
      if (userId != null) this.quota.estornar(userId);
      throw new ServiceUnavailableException(erro.message);
    }

    const relatorio = montarRelatorio(entrada, avaliacao, { projeto: projectName, modelo });
    const itens = relatorio.secoes.flatMap((s) => s.itens);
    const semAvaliacao = itens.filter((i) => i.origem === 'nao_avaliado').length;
    if (semAvaliacao === marcados.length) {
      // A IA respondeu, mas sem nenhum dos itens pedidos: melhor avisar do que entregar um PDF vazio.
      this.logger.warn(`IA devolveu avaliacao sem os itens pedidos (projeto ${projectId ?? '-'}).`);
      if (userId != null) this.quota.estornar(userId);
      throw new ServiceUnavailableException('A IA devolveu uma avaliação incompleta. Tente novamente.');
    }
    if (semAvaliacao) {
      this.logger.warn(`IA deixou ${semAvaliacao} item(ns) sem avaliacao (projeto ${projectId ?? '-'}).`);
    }

    const pdfBuffer = await gerarRelatorioPdf(relatorio);

    // O Node recusa cabecalhos com caracteres fora do Latin-1: um projeto com nome
    // em outro alfabeto derrubava a resposta com ERR_INVALID_CHAR. Gera um nome
    // ASCII (sem acentos; o resto vira "_").
    const safeProject =
      (projectName
        ? String(projectName)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/[^A-Za-z0-9\-_]+/g, '_')
        : 'relatorio') || 'relatorio';
    const filename = `relatorio-lgpd${projectId ? '-' + projectId : ''}-${safeProject}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  }
}
