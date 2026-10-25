import * as PDFKit from 'pdfkit';
import * as path from 'path';
import { CRITERIOS_GRAVIDADE, CRITERIOS_SITUACAO } from './criterios';
import {
  Gravidade,
  ItemRelatorio,
  Relatorio,
  SecaoRelatorio,
} from './relatorio.types';

/**
 * PDF do relatorio de conformidade.
 *
 * Pagina 1 (para quem decide): dados do relatorio, indice de conformidade, barras
 * por secao, resumo em linguagem simples, plano de acao do mais grave para o menos
 * grave e a legenda da escala.
 * Depois (para quem implementa): cada secao com o resumo dela e um card por
 * pergunta, com pontos fortes, lacunas e recomendacoes separados.
 */

const PDFDocument = (PDFKit as any).default || PDFKit;
const LOGO = path.join(__dirname, '..', '..', 'logo.png');

const LARGURA = 595.28;
const ALTURA = 841.89;
const MARGEM = 48;
const UTIL = LARGURA - MARGEM * 2;
/** Nada de conteudo abaixo daqui: o rodape fica na faixa de baixo. */
const LIMITE_Y = ALTURA - 64;

const COR = {
  texto: '#111827',
  suave: '#374151',
  fraco: '#6b7280',
  borda: '#e5e7eb',
  fundo: '#f9fafb',
  marca: '#2563eb',
  evidencia: '#0f766e',
};

type Visual = 'atende' | 'parcial' | 'nao_atende' | 'nao_avaliado';

const COR_VISUAL: Record<Visual, { fg: string; bg: string; barra: string }> = {
  atende: { fg: '#15803d', bg: '#dcfce7', barra: '#22c55e' },
  parcial: { fg: '#b45309', bg: '#fef3c7', barra: '#f59e0b' },
  nao_atende: { fg: '#b91c1c', bg: '#fee2e2', barra: '#ef4444' },
  nao_avaliado: { fg: '#4b5563', bg: '#f3f4f6', barra: '#d1d5db' },
};

const ROTULO_VISUAL: Record<Visual, string> = {
  atende: CRITERIOS_SITUACAO.atende.nome,
  parcial: CRITERIOS_SITUACAO.parcial.nome,
  nao_atende: CRITERIOS_SITUACAO.nao_atende.nome,
  nao_avaliado: 'Não avaliado',
};

const visual = (i: ItemRelatorio): Visual => i.situacao ?? 'nao_avaliado';

export interface Contagem {
  total: number;
  atende: number;
  parcial: number;
  nao_atende: number;
  nao_avaliado: number;
  naoMarcados: number;
}

export function contar(itens: ItemRelatorio[]): Contagem {
  const c: Contagem = {
    total: itens.length,
    atende: 0,
    parcial: 0,
    nao_atende: 0,
    nao_avaliado: 0,
    naoMarcados: 0,
  };
  for (const i of itens) {
    c[visual(i)]++;
    if (i.origem === 'nao_marcado') c.naoMarcados++;
  }
  return c;
}

/** % dos itens avaliados que atendem (os nao avaliados ficam fora da conta). */
export function indiceConformidade(c: Contagem): number | null {
  const avaliados = c.total - c.nao_avaliado;
  return avaliados ? Math.round((c.atende / avaliados) * 100) : null;
}

/**
 * Ordem do plano de acao: catastrofica, grave, item nao implementado (nao marcado,
 * sem gravidade porque nao passa pela IA), leve. Dentro de cada grupo, "nao atende"
 * antes de "parcial"; depois a ordem do checklist.
 */
const PESO_GRAVIDADE: Record<Gravidade, number> = {
  catastrofica: 0,
  grave: 1,
  leve: 3,
};

export function itensDoPlano(relatorio: Relatorio): ItemRelatorio[] {
  const todos = relatorio.secoes.flatMap((s) => s.itens);
  const peso = (i: ItemRelatorio) =>
    i.origem === 'nao_marcado' ? 2 : PESO_GRAVIDADE[i.gravidade ?? 'leve'];
  return todos
    .map((item, ordem) => ({ item, ordem }))
    .filter(
      ({ item }) =>
        item.situacao === 'parcial' || item.situacao === 'nao_atende',
    )
    .sort(
      (a, b) =>
        peso(a.item) - peso(b.item) ||
        (a.item.situacao === 'nao_atende' ? 0 : 1) -
          (b.item.situacao === 'nao_atende' ? 0 : 1) ||
        a.ordem - b.ordem,
    )
    .map(({ item }) => item);
}

function formatarData(d: Date): string {
  const s = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return s.replace(', ', ' às ');
}

export async function gerarRelatorioPdf(relatorio: Relatorio): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGEM, bottom: 40, left: MARGEM, right: MARGEM },
    bufferPages: true,
    info: {
      Title: `Relatório de Conformidade LGPD${relatorio.projeto ? ` - ${relatorio.projeto}` : ''}`,
      Author: 'DevComply',
    },
  });
  const partes: Buffer[] = [];
  doc.on('data', (b: Buffer) => partes.push(b));
  const fim = new Promise<Buffer>((resolve) =>
    doc.on('end', () => resolve(Buffer.concat(partes))),
  );

  let y = MARGEM;

  // ---------- utilitarios de desenho ----------
  const fonte = (negrito: boolean, tamanho: number, cor = COR.texto) =>
    doc
      .font(negrito ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(tamanho)
      .fillColor(cor);

  const altura = (
    texto: string,
    negrito: boolean,
    tamanho: number,
    largura: number,
    lineGap = 1.5,
  ) => {
    fonte(negrito, tamanho);
    return doc.heightOfString(texto, { width: largura, lineGap });
  };

  const escrever = (
    texto: string,
    x: number,
    yy: number,
    largura: number,
    opts: {
      negrito?: boolean;
      tamanho?: number;
      cor?: string;
      align?: string;
      lineGap?: number;
    } = {},
  ) => {
    fonte(!!opts.negrito, opts.tamanho ?? 10, opts.cor ?? COR.texto);
    doc.text(texto, x, yy, {
      width: largura,
      align: opts.align ?? 'left',
      lineGap: opts.lineGap ?? 1.5,
    });
    return altura(
      texto,
      !!opts.negrito,
      opts.tamanho ?? 10,
      largura,
      opts.lineGap ?? 1.5,
    );
  };

  const novaPagina = () => {
    doc.addPage();
    y = MARGEM;
  };

  const caber = (h: number) => {
    if (y + h > LIMITE_Y) novaPagina();
  };

  /** Etiqueta com fundo (ex.: "Atende parcialmente · Grave"); devolve a largura. */
  const etiqueta = (
    texto: string,
    x: number,
    yy: number,
    cor: { fg: string; bg: string },
    alinharDireita = false,
  ) => {
    fonte(true, 8);
    const w = doc.widthOfString(texto) + 12;
    const xx = alinharDireita ? x - w : x;
    doc.roundedRect(xx, yy, w, 15, 7.5).fill(cor.bg);
    fonte(true, 8, cor.fg);
    doc.text(texto, xx + 6, yy + 4, { width: w - 12, lineBreak: false });
    return w;
  };

  /** Barra empilhada atende / parcial / nao atende / nao avaliado. */
  const barra = (
    c: Contagem,
    x: number,
    yy: number,
    largura: number,
    h: number,
  ) => {
    doc.roundedRect(x, yy, largura, h, h / 2).fill(COR.borda);
    if (!c.total) return;
    doc.save();
    doc.roundedRect(x, yy, largura, h, h / 2).clip();
    let xx = x;
    for (const v of [
      'atende',
      'parcial',
      'nao_atende',
      'nao_avaliado',
    ] as Visual[]) {
      const w = (c[v] / c.total) * largura;
      if (w > 0) {
        doc.rect(xx, yy, w, h).fill(COR_VISUAL[v].barra);
        xx += w;
      }
    }
    doc.restore();
  };

  const tituloSecao = (texto: string, tamanho = 13) => {
    caber(40);
    y += escrever(texto, MARGEM, y, UTIL, { negrito: true, tamanho }) + 6;
  };

  const todos = relatorio.secoes.flatMap((s) => s.itens);
  const geral = contar(todos);
  const indice = indiceConformidade(geral);

  // ---------- Cabecalho ----------
  try {
    doc.image(LOGO, MARGEM, y, { width: 28, height: 28 });
  } catch {
    // sem logo: segue so com o texto
  }
  escrever(
    `Gerado em ${formatarData(relatorio.geradoEm)}`,
    MARGEM,
    y + 4,
    UTIL,
    {
      tamanho: 8.5,
      cor: COR.fraco,
      align: 'right',
    },
  );
  escrever('Relatório de Conformidade LGPD', MARGEM + 40, y, UTIL - 180, {
    negrito: true,
    tamanho: 18,
  });
  escrever(
    `Projeto: ${relatorio.projeto?.trim() || '(sem nome)'}`,
    MARGEM + 40,
    y + 24,
    UTIL - 40,
    {
      tamanho: 11,
      cor: COR.suave,
    },
  );
  y += 50;

  // Linha do metodo. A citacao completa fica em "Sobre este relatorio", no fim.
  // lineBreak:false: o PDFKit quebrava o nome do modelo no hifen ("gemini-3.5-" / "flash-lite").
  const sep = '   ·   ';
  const metaBase = [
    'Método: LGPD-Check (SBES 2021; SBQS 2023)',
    `${geral.total} perguntas`,
  ].join(sep);
  const metaModelo = relatorio.modelo
    ? `Análise por IA: ${relatorio.modelo}`
    : 'Análise por IA';
  fonte(false, 8, COR.fraco);
  if (doc.widthOfString(metaBase + sep + metaModelo) <= UTIL) {
    doc.text(metaBase + sep + metaModelo, MARGEM, y, { lineBreak: false });
    y += 12;
  } else {
    doc.text(metaBase, MARGEM, y, { lineBreak: false });
    doc.text(metaModelo, MARGEM, y + 11, { lineBreak: false });
    y += 23;
  }
  y += 8;
  doc
    .moveTo(MARGEM, y)
    .lineTo(MARGEM + UTIL, y)
    .lineWidth(1)
    .stroke(COR.borda);
  y += 16;

  // ---------- Visao geral ----------
  tituloSecao('Visão geral');

  const corIndice =
    indice === null
      ? COR.fraco
      : indice >= 70
        ? COR_VISUAL.atende.fg
        : indice >= 40
          ? COR_VISUAL.parcial.fg
          : COR_VISUAL.nao_atende.fg;
  escrever(indice === null ? '—' : `${indice}%`, MARGEM, y, 130, {
    negrito: true,
    tamanho: 30,
    cor: corIndice,
  });
  escrever('dos itens atendem', MARGEM, y + 34, 130, {
    tamanho: 9,
    cor: COR.suave,
  });
  escrever(
    `${geral.atende} de ${geral.total - geral.nao_avaliado} avaliados`,
    MARGEM,
    y + 46,
    130,
    { tamanho: 8, cor: COR.fraco },
  );

  // Contadores
  const caixas: Array<{ v: Visual; n: number }> = [
    { v: 'atende', n: geral.atende },
    { v: 'parcial', n: geral.parcial },
    { v: 'nao_atende', n: geral.nao_atende },
  ];
  if (geral.nao_avaliado)
    caixas.push({ v: 'nao_avaliado', n: geral.nao_avaliado });
  const xCaixas = MARGEM + 140;
  const larguraCaixa = (UTIL - 140 - (caixas.length - 1) * 8) / caixas.length;
  caixas.forEach((cx, k) => {
    const x = xCaixas + k * (larguraCaixa + 8);
    doc.roundedRect(x, y + 2, larguraCaixa, 52, 6).fill(COR_VISUAL[cx.v].bg);
    escrever(String(cx.n), x + 10, y + 9, larguraCaixa - 20, {
      negrito: true,
      tamanho: 18,
      cor: COR_VISUAL[cx.v].fg,
    });
    escrever(ROTULO_VISUAL[cx.v], x + 10, y + 33, larguraCaixa - 20, {
      negrito: true,
      tamanho: 8.5,
      cor: COR_VISUAL[cx.v].fg,
    });
  });
  y += 62;
  if (geral.naoMarcados) {
    y +=
      escrever(
        `"Não atende" inclui ${geral.naoMarcados} ${geral.naoMarcados === 1 ? 'item não marcado' : 'itens não marcados'} no checklist (declarados como não implementados).`,
        xCaixas,
        y,
        UTIL - 140,
        { tamanho: 8, cor: COR.fraco },
      ) + 4;
  }
  y += 10;

  // Barras por secao
  for (const secao of relatorio.secoes) {
    const c = contar(secao.itens);
    caber(20);
    escrever(secao.titulo, MARGEM, y + 1, 175, {
      tamanho: 9.5,
      cor: COR.suave,
    });
    barra(c, MARGEM + 180, y + 2, UTIL - 180 - 95, 9);
    escrever(
      `${c.atende} de ${c.total} atendem`,
      MARGEM + UTIL - 88,
      y + 1,
      88,
      {
        tamanho: 8.5,
        cor: COR.fraco,
        align: 'right',
      },
    );
    y += 19;
  }
  // Legenda das cores das barras
  let xl = MARGEM + 180;
  for (const v of [
    'atende',
    'parcial',
    'nao_atende',
    'nao_avaliado',
  ] as Visual[]) {
    if (v === 'nao_avaliado' && !geral.nao_avaliado) continue;
    doc.roundedRect(xl, y + 2, 7, 7, 1.5).fill(COR_VISUAL[v].barra);
    fonte(false, 7.5, COR.fraco);
    doc.text(ROTULO_VISUAL[v], xl + 10, y + 1.5, { lineBreak: false });
    xl += 10 + doc.widthOfString(ROTULO_VISUAL[v]) + 14;
  }
  y += 24;

  // ---------- Resumo ----------
  if (relatorio.resumoExecutivo?.trim()) {
    const texto = relatorio.resumoExecutivo.trim();
    caber(30 + altura(texto, false, 10, UTIL, 2.5));
    tituloSecao('Resumo');
    y +=
      escrever(texto, MARGEM, y, UTIL, {
        tamanho: 10,
        cor: COR.suave,
        lineGap: 2.5,
      }) + 18;
  }

  // ---------- Plano de acao ----------
  const plano = itensDoPlano(relatorio);
  caber(90);
  tituloSecao('Plano de ação');
  y +=
    escrever(
      plano.length
        ? 'Itens que não atendem ou atendem parcialmente, do mais grave para o menos grave.'
        : 'Todos os itens avaliados atendem. Mantenha as evidências atualizadas.',
      MARGEM,
      y - 2,
      UTIL,
      { tamanho: 8.5, cor: COR.fraco },
    ) + 8;

  if (plano.length) {
    const col = { n: 18, grav: 84, item: 168 };
    const xGrav = MARGEM + col.n;
    const xItem = xGrav + col.grav;
    const xAcao = xItem + col.item;
    const larguraAcao = MARGEM + UTIL - xAcao;

    const cabecalhoTabela = () => {
      doc.rect(MARGEM, y, UTIL, 18).fill(COR.fundo);
      fonte(true, 8, COR.fraco);
      doc.text('#', MARGEM + 4, y + 5, { lineBreak: false });
      doc.text('GRAVIDADE', xGrav, y + 5, { lineBreak: false });
      doc.text('ITEM', xItem, y + 5, { lineBreak: false });
      doc.text('O QUE FAZER', xAcao, y + 5, { lineBreak: false });
      y += 22;
    };
    cabecalhoTabela();

    plano.forEach((item, k) => {
      const grav =
        item.origem === 'nao_marcado'
          ? 'Não implementado'
          : CRITERIOS_GRAVIDADE[item.gravidade ?? 'leve'].nome;
      const sit =
        item.origem === 'nao_marcado'
          ? 'Não marcado'
          : ROTULO_VISUAL[visual(item)];
      const corGrav =
        item.origem === 'nao_marcado'
          ? COR.suave
          : item.gravidade === 'leve'
            ? COR_VISUAL.parcial.fg
            : COR_VISUAL.nao_atende.fg;
      const textoItem = `${item.codigo} · ${item.pergunta}`;
      const acao =
        item.recomendacoes[0] ?? 'Revise o item e descreva a implementação.';
      const h =
        Math.max(
          altura(grav, true, 8.5, col.grav - 6) +
            altura(sit, false, 7.5, col.grav - 6) +
            2,
          altura(textoItem, false, 8.5, col.item - 10),
          altura(acao, false, 8.5, larguraAcao),
        ) + 10;
      if (y + h > LIMITE_Y) {
        novaPagina();
        cabecalhoTabela();
      }
      escrever(String(k + 1), MARGEM + 4, y, col.n - 4, {
        tamanho: 8.5,
        cor: COR.fraco,
      });
      const hg = escrever(grav, xGrav, y, col.grav - 6, {
        negrito: true,
        tamanho: 8.5,
        cor: corGrav,
      });
      escrever(sit, xGrav, y + hg + 1, col.grav - 6, {
        tamanho: 7.5,
        cor: COR.fraco,
      });
      escrever(textoItem, xItem, y, col.item - 10, {
        tamanho: 8.5,
        cor: COR.suave,
      });
      escrever(acao, xAcao, y, larguraAcao, { tamanho: 8.5, cor: COR.texto });
      y += h;
      doc
        .moveTo(MARGEM, y - 5)
        .lineTo(MARGEM + UTIL, y - 5)
        .lineWidth(0.5)
        .stroke(COR.borda);
    });
    y += 10;
  }

  // ---------- Detalhes por secao ----------
  // Com espaco sobrando depois do plano de acao, comeca na mesma pagina.
  if (LIMITE_Y - y < 260) {
    novaPagina();
  } else {
    y += 12;
    doc
      .moveTo(MARGEM, y)
      .lineTo(MARGEM + UTIL, y)
      .lineWidth(1)
      .stroke(COR.borda);
    y += 22;
  }
  y +=
    escrever('Detalhes por seção', MARGEM, y, UTIL, {
      negrito: true,
      tamanho: 16,
    }) + 4;
  y +=
    escrever(
      'Cada pergunta do checklist com a situação, o que já está bom, o que falta e o que fazer.',
      MARGEM,
      y,
      UTIL,
      { tamanho: 9, cor: COR.fraco },
    ) + 16;

  const PAD = 12;
  const xCard = MARGEM + 4; // depois da faixa colorida
  const larguraInterna = UTIL - 4 - PAD * 2;

  type Bloco = {
    rotulo: string;
    cor: string;
    linhas: string[];
    nota?: boolean;
  };
  const blocos = (item: ItemRelatorio): Bloco[] => {
    if (item.origem === 'nao_marcado') {
      return [
        {
          rotulo: '',
          cor: COR.fraco,
          linhas: [
            'Item não marcado no checklist: entra como "Não atende", sem análise da IA.',
          ],
          nota: true,
        },
        {
          rotulo: 'Recomendação do LGPD-Check',
          cor: COR.marca,
          linhas: item.recomendacoes,
        },
      ];
    }
    if (item.origem === 'nao_avaliado') {
      return [
        {
          rotulo: '',
          cor: COR.fraco,
          linhas: [
            'A IA não devolveu a avaliação deste item. Gere o relatório de novo.',
          ],
          nota: true,
        },
      ];
    }
    return [
      {
        rotulo: 'Pontos fortes',
        cor: COR_VISUAL.atende.fg,
        linhas: item.pontosFortes,
      },
      {
        rotulo: 'Lacunas',
        cor: COR_VISUAL.nao_atende.fg,
        linhas: item.lacunas,
      },
      { rotulo: 'Recomendações', cor: COR.marca, linhas: item.recomendacoes },
      {
        rotulo: 'Evidências a guardar',
        cor: COR.evidencia,
        linhas: item.evidencias,
      },
    ].filter((b) => b.linhas.length);
  };

  const alturaBloco = (b: Bloco) =>
    (b.rotulo ? 13 : 0) +
    b.linhas.reduce(
      (s, l) =>
        s +
        altura(
          l,
          false,
          9,
          b.nota ? larguraInterna : larguraInterna - 10,
          1.5,
        ) +
        3,
      0,
    );

  const alturaCard = (item: ItemRelatorio) =>
    PAD +
    18 +
    altura(item.pergunta, true, 10.5, larguraInterna, 1.5) +
    8 +
    blocos(item).reduce((s, b) => s + alturaBloco(b) + 6, 0) +
    PAD -
    6;

  const rotuloEtiqueta = (item: ItemRelatorio) => {
    const base = ROTULO_VISUAL[visual(item)];
    if (item.origem === 'nao_marcado') return `${base} · não marcado`;
    if (item.gravidade && item.situacao !== 'atende')
      return `${base} · ${CRITERIOS_GRAVIDADE[item.gravidade].nome}`;
    return base;
  };

  const desenharCard = (item: ItemRelatorio) => {
    const h = alturaCard(item);
    caber(h);
    const cor = COR_VISUAL[visual(item)];
    const y0 = y;
    doc.roundedRect(MARGEM, y0, UTIL, h, 6).lineWidth(1).stroke(COR.borda);
    doc.save();
    doc.roundedRect(MARGEM, y0, UTIL, h, 6).clip();
    doc.rect(MARGEM, y0, 4, h).fill(cor.barra);
    doc.restore();

    let yy = y0 + PAD;
    const xi = xCard + PAD;
    // Codigo + artigo | situacao
    fonte(true, 8);
    const wCod = doc.widthOfString(item.codigo) + 10;
    doc.roundedRect(xi, yy, wCod, 15, 3).fill(COR.fundo);
    doc.roundedRect(xi, yy, wCod, 15, 3).lineWidth(0.5).stroke(COR.borda);
    fonte(true, 8, COR.suave);
    doc.text(item.codigo, xi + 5, yy + 4, { lineBreak: false });
    if (item.referencia) {
      fonte(false, 8, COR.fraco);
      doc.text(item.referencia, xi + wCod + 8, yy + 4, { lineBreak: false });
    }
    etiqueta(rotuloEtiqueta(item), xi + larguraInterna, yy, cor, true);
    yy += 22;

    yy +=
      escrever(item.pergunta, xi, yy, larguraInterna, {
        negrito: true,
        tamanho: 10.5,
      }) + 8;

    for (const b of blocos(item)) {
      if (b.rotulo) {
        escrever(b.rotulo.toUpperCase(), xi, yy, larguraInterna, {
          negrito: true,
          tamanho: 7.5,
          cor: b.cor,
        });
        yy += 13;
      }
      for (const linha of b.linhas) {
        if (b.nota) {
          yy +=
            escrever(linha, xi, yy, larguraInterna, {
              tamanho: 9,
              cor: COR.fraco,
            }) + 3;
          continue;
        }
        fonte(true, 9, b.cor);
        doc.text('•', xi, yy, { lineBreak: false });
        yy +=
          escrever(linha, xi + 10, yy, larguraInterna - 10, {
            tamanho: 9,
            cor: COR.suave,
          }) + 3;
      }
      yy += 6;
    }
    y = y0 + h + 10;
  };

  relatorio.secoes.forEach((secao: SecaoRelatorio, k) => {
    const c = contar(secao.itens);
    const resumo = secao.resumo?.trim();
    const hCabecalho =
      26 + 16 + (resumo ? altura(resumo, false, 9.5, UTIL, 2) + 10 : 0);
    // Cabecalho da secao junto com o primeiro card
    caber(hCabecalho + (secao.itens[0] ? alturaCard(secao.itens[0]) : 0));
    if (k > 0) y += 8;

    escrever(secao.titulo, MARGEM, y, UTIL - 120, {
      negrito: true,
      tamanho: 13.5,
    });
    if (secao.referencia) {
      escrever(secao.referencia, MARGEM, y + 3, UTIL, {
        tamanho: 8.5,
        cor: COR.fraco,
        align: 'right',
      });
    }
    y += 24;
    barra(c, MARGEM, y + 2, 140, 7);
    const partes = [`${c.atende} de ${c.total} atendem`];
    if (c.parcial) partes.push(`${c.parcial} parcialmente`);
    if (c.nao_atende)
      partes.push(
        `${c.nao_atende} não ${c.nao_atende === 1 ? 'atende' : 'atendem'}`,
      );
    if (c.nao_avaliado)
      partes.push(
        `${c.nao_avaliado} não avaliado${c.nao_avaliado === 1 ? '' : 's'}`,
      );
    escrever(partes.join(' · '), MARGEM + 150, y, UTIL - 150, {
      tamanho: 8.5,
      cor: COR.fraco,
    });
    y += 16;
    if (resumo) {
      y +=
        escrever(resumo, MARGEM, y, UTIL, {
          tamanho: 9.5,
          cor: COR.suave,
          lineGap: 2,
        }) + 10;
    }
    for (const item of secao.itens) desenharCard(item);
  });

  // ---------- Como ler (no fim: quem decide le o resumo; a legenda e consulta) ----------
  const linhasLegenda: Array<{
    rotulo: string;
    texto: string;
    cor?: { fg: string; bg: string };
  }> = [
    ...(['atende', 'parcial', 'nao_atende'] as const).map((s) => ({
      rotulo: CRITERIOS_SITUACAO[s].nome,
      texto: CRITERIOS_SITUACAO[s].criterio,
      cor: COR_VISUAL[s],
    })),
    ...(['leve', 'grave', 'catastrofica'] as const).map((g) => ({
      rotulo: `Gravidade ${CRITERIOS_GRAVIDADE[g].nome.toLowerCase()}`,
      texto: CRITERIOS_GRAVIDADE[g].criterio,
    })),
    {
      rotulo: 'Não marcado',
      texto:
        'O item não foi marcado como implementado no checklist. Entra como "Não atende", sem análise da IA e sem gravidade, com a recomendação do LGPD-Check.',
    },
    {
      rotulo: 'Evidências a guardar',
      texto:
        'O que manter arquivado para comprovar o item numa auditoria (print com data, documento, registro ou log), sugerido pela IA a partir do que foi descrito.',
    },
    {
      rotulo: 'Sobre o método',
      texto:
        'Perguntas do LGPD-Check: Mendes, Viana e Rivero, "Developing an Inspection Checklist for the Adequacy Assessment of Software Systems to Quality Attributes of the Brazilian General Data Protection Law" (SBES 2021); Neitzke et al., "Enhancing LGPD Compliance: Evaluating a Checklist for LGPD Quality Attributes within a Government Office" (SBQS 2023). A situação dos itens marcados é avaliada por IA a partir das respostas do checklist.',
    },
  ];
  const larguraRotulo = 118;
  const alturaLegenda =
    30 +
    linhasLegenda.reduce(
      (s, l) =>
        s + Math.max(15, altura(l.texto, false, 8.5, UTIL - larguraRotulo)) + 5,
      0,
    );
  caber(Math.min(alturaLegenda, LIMITE_Y - MARGEM));
  y += 6;
  tituloSecao('Como ler este relatório', 11);
  for (const l of linhasLegenda) {
    const h = Math.max(15, altura(l.texto, false, 8.5, UTIL - larguraRotulo));
    caber(h + 5);
    if (l.cor) etiqueta(l.rotulo, MARGEM, y - 1, l.cor);
    else
      escrever(l.rotulo, MARGEM, y + 1, larguraRotulo - 8, {
        negrito: true,
        tamanho: 8.5,
        cor: COR.suave,
      });
    escrever(l.texto, MARGEM + larguraRotulo, y + 1, UTIL - larguraRotulo, {
      tamanho: 8.5,
      cor: COR.suave,
    });
    y += h + 5;
  }

  // ---------- Rodape em todas as paginas ----------
  const paginas = doc.bufferedPageRange().count;
  for (let p = 0; p < paginas; p++) {
    doc.switchToPage(p);
    const margemInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // escrever abaixo da margem abriria uma pagina nova
    const yRodape = ALTURA - 38;
    doc
      .moveTo(MARGEM, yRodape - 8)
      .lineTo(MARGEM + UTIL, yRodape - 8)
      .lineWidth(0.5)
      .stroke(COR.borda);
    fonte(false, 7.5, COR.fraco);
    doc.text(
      'DevComply · Relatório gerado com apoio de IA. Valide com especialistas; não substitui parecer jurídico.',
      MARGEM,
      yRodape,
      { width: UTIL - 70, lineBreak: false },
    );
    doc.text(`Página ${p + 1} de ${paginas}`, MARGEM, yRodape, {
      width: UTIL,
      align: 'right',
      lineBreak: false,
    });
    doc.page.margins.bottom = margemInferior;
  }

  doc.end();
  return fim;
}
