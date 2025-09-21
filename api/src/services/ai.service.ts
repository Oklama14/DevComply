import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import * as PDFKit from 'pdfkit';
import { Conformidade, Resposta, GerarRelatorioDto } from '../types/ai.types';

@Injectable()
export class AiService {
  private readonly genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_API_KEY ?? 'AIzaSyD9AQZ8ugb04uG58tjBnlLC65H1gjJfnXQ'
  );

  async gerarJSON(dto: GerarRelatorioDto): Promise<Resposta[]> {
    const instrucao = dto.instrucao ?? 'Escreva no máximo um único parágrafo.';

    const prompt =
      `Baseando-se na LGPD (Lei Geral de Proteção de Dados) e na categoria "${dto.categoria}", ` +
      `o usuário implementou sua ferramenta desta forma: ${dto.resposta_implementacao}. ` +
      `Usando as seguintes tecnologias: ${dto.resposta_tecnica}. ` +
      `Gere um relatório de conformidade, destacando pontos fortes e possíveis lacunas.`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              titulo: { type: SchemaType.STRING },
              resumo: { type: SchemaType.STRING },
              em_conformidade: {
                type: SchemaType.STRING,
                format: 'enum', // necessário pelo tipo EnumStringSchema
                enum: [
                  Conformidade.LOW,
                  Conformidade.MEDIUM,
                  Conformidade.HIGH,
                  Conformidade.VERY_HIGH,
                ],
              },
            },
            required: ['titulo', 'resumo', 'em_conformidade'],
            
          },
        } satisfies Schema,
      },
      systemInstruction: instrucao,
    });
    console.log('>>> Prompt:',prompt)
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('>>> Gemini raw response:', result.response.text());

    return JSON.parse(text) as Resposta[];
  }

 async gerarPDF(respostas: Resposta[]): Promise<Buffer> {
  const PDFDocument = (PDFKit as any).default || PDFKit;
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (c: Buffer) => chunks.push(c));
  const endPromise = new Promise<Buffer>((resolve) =>
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  );

  // Título principal
  doc.fontSize(18).fillColor('#111827').text('Relatório de Conformidade LGPD', {
    align: 'center',
    underline: true,
  });
  doc.moveDown(1.5);

  respostas.forEach((r, idx) => {
    if (idx > 0) doc.addPage(); // cada resposta em uma página

    doc.fontSize(14).fillColor('#2563eb').text(`Conformidade: ${r.em_conformidade}`, {
      underline: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(16).fillColor('#111827').text(r.titulo, {
      bold: true,
    });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#374151').text(r.resumo, {
      width: doc.page.width - 100,
      align: 'justify',
    });
  });

  doc.end();
  return endPromise;
}

}
