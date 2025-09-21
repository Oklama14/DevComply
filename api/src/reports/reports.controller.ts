import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AiService } from '@/services/ai.service';
import { Resposta, GerarRelatorioDto, FrontCategory } from '@/types/ai.types';

@Controller('reports')
export class ReportsController {
  constructor(private readonly ai: AiService) {}

  // ====== 1) multipart/form-data: arquivo JSON ======
  @Post('checklist')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChecklist(
    @UploadedFile() file: any,
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Arquivo ausente (campo "file").');
    }

    let payload: FrontCategory[];
    try {
      const text = file.buffer.toString('utf8');
      payload = JSON.parse(text);
    } catch (e: any) {
      throw new BadRequestException('JSON inválido no arquivo enviado.');
    }

    return this.generateAndSendPdf(payload, res, body?.projectId, body?.projectName);
  }

  // ====== 2) application/json: JSON direto ======
  @Post('checklist-json')
  async uploadChecklistJson(@Body() payload: FrontCategory[], @Res() res: Response) {
    if (!Array.isArray(payload)) {
      throw new BadRequestException('Payload deve ser um array de categorias.');
    }
    return this.generateAndSendPdf(payload, res);
  }

  // ====== helper: chama IA e gera o PDF ======
  private async generateAndSendPdf(
    categories: FrontCategory[],
    res: Response,
    projectId?: string | number,
    projectName?: string,
  ) {
    const allRespostas: Resposta[] = [];

    for (const cat of categories) {
      const implementacao = (cat.items || [])
        .map((i) => `• ${i.titulo_item}: ${i.resposta_implementacao ?? '(sem resposta)'}`)
        .join('\n');

      const tecnica = (cat.items || [])
        .map((i) => `• ${i.titulo_item}: ${i.resposta_tecnica ?? '(sem detalhes)'}`)
        .join('\n');

      const dto: GerarRelatorioDto = {
        instrucao: 'Escreva no máximo um único parágrafo.',
        categoria: cat.categoria_nome,
        resposta_implementacao: implementacao,
        resposta_tecnica: tecnica,
        artigo_referente: cat.items[0]?.artigo_referente, // pega do primeiro item (se houver)
      };

      const respostas = await this.ai.gerarJSON(dto);
      allRespostas.push(...respostas);
    }

    if (!allRespostas.length) {
      allRespostas.push({
        titulo: 'Sem dados',
        resumo: 'Não foi possível gerar respostas.',
        em_conformidade: 'Incompleto' as any,
      });
    }

    const pdfBuffer = await this.ai.gerarPDF(allRespostas);

    const safeProject =
      (projectName ? String(projectName).trim().replace(/[^\p{L}\p{N}\-_]+/gu, '_') : 'relatorio') ||
      'relatorio';
    const filename = `relatorio-lgpd${projectId ? '-' + projectId : ''}-${safeProject}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  }
}
