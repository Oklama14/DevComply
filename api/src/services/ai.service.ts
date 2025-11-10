import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import * as PDFKit from 'pdfkit';
import { Conformidade, Resposta, GerarRelatorioDto } from '../types/ai.types';
import * as path from 'path';

const logoPath = path.join(__dirname, '..', '..', 'logo.png');

@Injectable()
export class AiService {
  private readonly genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_API_KEY ?? 'xxxxxx'
  );

  async gerarJSON(dto: GerarRelatorioDto): Promise<Resposta[]> {
    const instrucao = dto.instrucao ?? 'Escreva no máximo um único parágrafo.';

    const prompt =
      `Baseando-se na LGPD (Lei Geral de Proteção de Dados) e na categoria "${dto.categoria}", ` +
      `o usuário implementou sua ferramenta desta forma: ${dto.resposta_implementacao}. ` +
      `Usando as seguintes tecnologias: ${dto.resposta_tecnica}. ` +
      `Gere um relatório de conformidade, destacando pontos fortes e possíveis lacunas. Para cada possível lacuna, informe uma sugestão de melhoria relacionada ao gap. `;

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
                format: 'enum',
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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as Resposta[];
  }

  async gerarPDF(respostas: Resposta[], projectName?: string): Promise<Buffer> {
    const PDFDocument = (PDFKit as any).default || PDFKit;
    const doc = new PDFDocument({ 
      margin: 50, 
      bufferPages: true,
      size: 'A4'
    });
    
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const endPromise = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    );

    // Configurações de layout
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginX = 50;
    const marginY = 50;
    const cardWidth = pageWidth - (marginX * 2);
    const bottomMargin = 100; // Espaço reservado para rodapé
    const maxY = pageHeight - bottomMargin;
    
    // === CABEÇALHO (apenas na primeira página) ===
    // Logo
    try {
      doc.image(logoPath, marginX, marginY, { width: 30, height: 30 });
    } catch {
      doc.fontSize(10)
         .fillColor('#f00')
         .text('[Logo não encontrada]', marginX, marginY);
    }

    // Título do relatório
    doc.fontSize(18)
       .fillColor('#111827')
       .text('Relatório de Conformidade LGPD', 140, marginY + 10);
    
    // Nome do projeto
    if (projectName) {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Projeto: ${projectName}`, 140, marginY + 35);
    }

    // Linha divisória
    const lineY = marginY + 80;
    doc.moveTo(marginX, lineY)
       .lineTo(pageWidth - marginX, lineY)
       .stroke('#cccccc');
    
    // Posição inicial após cabeçalho
    let currentY = lineY + 20;

    // === CORPO: Cards de respostas ===
    const colorMap: Record<string, string> = {
      'Incompleto': '#dc2626',
      'Básico': '#f59e0b',
      'Adequado': '#16a34a',
      'Avançado': '#2563eb',
    };

    respostas.forEach((resposta, index) => {
      const padding = 15;
      const innerWidth = cardWidth - (padding * 2);
      const espacoEntreElementos = 8;
      
      // Primeiro, fazemos um "dry run" para calcular a altura real necessária
      doc.save(); // Salva o estado atual do documento
      
      // Calcula altura real do título (pode ter múltiplas linhas)
      doc.fontSize(13).font('Helvetica-Bold');
      const tituloHeight = doc.heightOfString(resposta.titulo, {
        width: innerWidth,
        lineGap: 2
      });
      
      // Calcula altura real do resumo
      doc.fontSize(10).font('Helvetica');
      const resumoHeight = doc.heightOfString(resposta.resumo, {
        width: innerWidth,
        align: 'justify',
        lineGap: 2
      });
      
      doc.restore(); // Restaura o estado
      
      // Altura total do card = padding superior + conformidade + espaço + título + espaço + resumo + padding inferior
      const conformidadeHeight = 15; // Altura fixa para linha de conformidade
      const cardHeight = padding + 
                         conformidadeHeight + 
                         espacoEntreElementos + 
                         tituloHeight + 
                         espacoEntreElementos + 
                         resumoHeight + 
                         padding;
      
      // Verifica se precisa de nova página
      if (currentY + cardHeight > maxY) {
        doc.addPage();
        currentY = marginY;
      }
      
      // Desenha o card com a altura calculada
      doc.roundedRect(marginX, currentY, cardWidth, cardHeight, 8)
         .strokeColor('#d1d5db')
         .lineWidth(1)
         .stroke();
      
      // Posição inicial do texto dentro do card
      let textY = currentY + padding;
      
      // Badge de conformidade
      const conformidadeColor = colorMap[resposta.em_conformidade] || '#374151';
      doc.fontSize(11)
         .fillColor(conformidadeColor)
         .font('Helvetica')
         .text(`Conformidade: ${resposta.em_conformidade}`, marginX + padding, textY, {
           width: innerWidth
         });
      
      // Avança para o título
      textY += conformidadeHeight + espacoEntreElementos;
      
      // Título
      doc.fontSize(13)
         .fillColor('#111827')
         .font('Helvetica-Bold')
         .text(resposta.titulo, marginX + padding, textY, {
           width: innerWidth,
           lineGap: 2
         });
      
      // Avança para o resumo (baseado na altura real do título)
      textY += tituloHeight + espacoEntreElementos;
      
      // Resumo
      doc.fontSize(10)
         .fillColor('#374151')
         .font('Helvetica')
         .text(resposta.resumo, marginX + padding, textY, {
           width: innerWidth,
           align: 'justify',
           lineGap: 2
         });
      
      // Atualiza posição para próximo card
      currentY += cardHeight + 15; // 15px de espaço entre cards
    });

    // === RODAPÉ ===
    // Aviso de relatório gerado por IA (posicionado após o último card)
    if (currentY + 50 < maxY) {
      // Se couber na página atual
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(
           'Importante: Este relatório foi gerado automaticamente por IA. Valide sempre com especialistas.',
           marginX,
           currentY + 30,
           { 
             width: cardWidth, 
             align: 'center' 
           }
         );
    } else {
      // Se não couber, coloca no final da página
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(
           'Importante: Este relatório foi gerado automaticamente por IA. Valide sempre com especialistas.',
           marginX,
           pageHeight - 70,
           { 
             width: cardWidth, 
             align: 'center' 
           }
         );
    }
    
    // Numeração de páginas
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(9)
         .fillColor('#9ca3af')
         .font('Helvetica')
         .text(
           `Página ${i + 1} de ${pageCount}`,
           marginX,
           pageHeight - 40,
           { 
             width: cardWidth, 
             align: 'center' 
           }
         );
    }

    doc.end();
    return endPromise;
  }
}
