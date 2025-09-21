import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from '../services/ai.service';
import { GerarRelatorioDto } from '../types/ai.types';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // POST /ai/relatorio-json  -> retorna o JSON estruturado
  @Post('relatorio-json')
  async relatorioJson(@Body() dto: GerarRelatorioDto) {
    const respostas = await this.ai.gerarJSON(dto);
    return { ok: true, respostas };
  }

  // POST /ai/relatorio-pdf   -> retorna PDF (application/pdf)
  @Post('relatorio-pdf')
  async relatorioPdf(@Body() dto: GerarRelatorioDto, @Res() res: Response) {
    const respostas = await this.ai.gerarJSON(dto);
    const pdf = await this.ai.gerarPDF(respostas);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-lgpd.pdf"');
    res.send(pdf);
  }
}
