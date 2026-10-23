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
import { Resposta, GerarRelatorioDto, FrontCategory, FrontItem, Conformidade } from '@/types/ai.types';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ProjectsService } from '@/projects/projects.service';
import { UsersService } from '@/users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly ai: AiService,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  // ====== 1) multipart/form-data: arquivo JSON ======
  @Post('checklist')
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
    return this.generateAndSendPdf(payload, res, body?.projectId, body?.projectName, apiKey);
  }


  // ====== 2) application/json: JSON direto ======
  @Post('checklist-json')
  async uploadChecklistJson(
    @Request() req,
    @Body() payload: FrontCategory[],
    @Res() res: Response,
  ) {
    if (!Array.isArray(payload)) {
      throw new BadRequestException('Payload deve ser um array de categorias.');
    }
    const apiKey = (await this.usersService.getGeminiKey(req.user.userId)) ?? undefined;
    return this.generateAndSendPdf(payload, res, undefined, undefined, apiKey);
  }

  // ====== helper: chama IA e gera o PDF ======
  private async generateAndSendPdf(
    categories: FrontCategory[],
    res: Response,
    projectId?: string | number,
    projectName?: string,
    apiKey?: string,
  ) {
    const linha = (i: FrontItem, texto: string | undefined, vazio: string) => {
      const ref = [i.codigo, i.artigo_referente].filter(Boolean).join(' | ');
      return `• ${ref ? `[${ref}] ` : ''}${i.titulo_item}: ${texto?.trim() || vazio}`;
    };

    // Categorias em paralelo: com o checklist completo (6 secoes) a versao
    // sequencial podia passar de minutos.
    const resultados = await Promise.allSettled(
      categories.map((cat) => {
        const items = cat.items || [];
        const dto: GerarRelatorioDto = {
          instrucao: 'Escreva no máximo um único parágrafo por item.',
          categoria: cat.categoria_nome,
          resposta_implementacao: items
            .map((i) => linha(i, i.resposta_implementacao, '(sem resposta)'))
            .join('\n'),
          resposta_tecnica: items
            .map((i) => linha(i, i.resposta_tecnica, '(sem detalhes)'))
            .join('\n'),
          artigo_referente: items[0]?.artigo_referente,
        };
        return this.ai.gerarJSON(dto, apiKey);
      }),
    );

    const allRespostas: Resposta[] = [];
    const falhas: IaIndisponivelError[] = [];

    resultados.forEach((r, idx) => {
      const cat = categories[idx];
      if (r.status === 'fulfilled') {
        allRespostas.push(...r.value);
        return;
      }
      const erro =
        r.reason instanceof IaIndisponivelError
          ? r.reason
          : new IaIndisponivelError('Não foi possível gerar a análise pela IA.', 'outro');
      falhas.push(erro);
      // Antes o erro era engolido sem log; agora fica no log do servidor (Railway).
      this.logger.warn(
        `IA falhou na categoria "${cat.categoria_nome}" (projeto ${projectId ?? '-'}): ` +
          `${erro.motivo} - ${String((r.reason as Error)?.message ?? r.reason)}`,
      );
      // Uma categoria com falha nao derruba o relatorio inteiro.
      allRespostas.push({
        titulo: `Categoria: ${cat.categoria_nome}`,
        resumo: `Esta categoria não foi avaliada: ${erro.message}`,
        em_conformidade: Conformidade.NAO_AVALIADO,
      });
    });

    // Se nenhuma categoria foi avaliada, nao devolve um PDF "vazio" que parece
    // um relatorio: responde erro para o front mostrar o motivo ao usuario.
    if (categories.length > 0 && falhas.length === categories.length) {
      throw new ServiceUnavailableException(falhas[0].message);
    }

    if (!allRespostas.length) {
      throw new BadRequestException('Nenhum item marcado no checklist para gerar o relatório.');
    }

    const pdfBuffer = await this.ai.gerarPDF(allRespostas, projectName);

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
