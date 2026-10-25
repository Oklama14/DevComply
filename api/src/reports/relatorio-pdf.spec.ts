import {
  contar,
  gerarRelatorioPdf,
  indiceConformidade,
  itensDoPlano,
} from './relatorio-pdf';
import { ItemRelatorio, Relatorio } from './relatorio.types';

const item = (
  codigo: string,
  extra: Partial<ItemRelatorio>,
): ItemRelatorio => ({
  codigo,
  pergunta: `Pergunta ${codigo}?`,
  origem: 'ia',
  pontosFortes: [],
  lacunas: [],
  recomendacoes: [],
  evidencias: [],
  ...extra,
});

const relatorio: Relatorio = {
  projeto: 'Clínica Ação',
  geradoEm: new Date('2026-10-25T17:30:00Z'),
  modelo: 'gemini-3.8-flash',
  resumoExecutivo: 'Resumo em linguagem simples.',
  secoes: [
    {
      titulo: 'Transparência de dados',
      resumo: 'Bem informada.',
      itens: [
        item('T-03', {
          situacao: 'atende',
          pontosFortes: ['Política no rodapé'],
          evidencias: ['Print da política com a data da versão'],
        }),
        item('T-09', {
          situacao: 'parcial',
          gravidade: 'leve',
          lacunas: ['Falta versão'],
          recomendacoes: ['Versione'],
        }),
      ],
    },
    {
      titulo: 'Responsabilidade do controlador',
      itens: [
        item('R-01', {
          origem: 'nao_marcado',
          situacao: 'nao_atende',
          recomendacoes: ['Indique um encarregado'],
        }),
        item('R-03', {
          situacao: 'nao_atende',
          gravidade: 'catastrofica',
          lacunas: ['Sem plano'],
          recomendacoes: ['Crie um plano'],
        }),
        item('R-04', {
          situacao: 'parcial',
          gravidade: 'grave',
          recomendacoes: ['Faça o RIPD'],
        }),
        item('R-05', { origem: 'nao_avaliado' }),
      ],
    },
  ],
};

const paginas = (buf: Buffer) =>
  (buf.toString('latin1').match(/\/Type \/Page[^s]/g) ?? []).length;

describe('relatorio-pdf', () => {
  it('conta por situacao e calcula o indice sem os nao avaliados', () => {
    const c = contar(relatorio.secoes.flatMap((s) => s.itens));
    expect(c).toEqual({
      total: 6,
      atende: 1,
      parcial: 2,
      nao_atende: 2,
      nao_avaliado: 1,
      naoMarcados: 1,
    });
    expect(indiceConformidade(c)).toBe(20); // 1 de 5 avaliados
  });

  it('plano de acao: catastrofica, grave, nao implementado, leve', () => {
    expect(itensDoPlano(relatorio).map((i) => i.codigo)).toEqual([
      'R-03',
      'R-04',
      'R-01',
      'T-09',
    ]);
  });

  it('gera um PDF com a pagina de resumo e os detalhes', async () => {
    const buf = await gerarRelatorioPdf(relatorio);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(paginas(buf)).toBeGreaterThanOrEqual(2);
  });

  it('nao quebra com checklist sem itens a corrigir nem resumo', async () => {
    const buf = await gerarRelatorioPdf({
      geradoEm: new Date(),
      secoes: [{ titulo: 'S', itens: [item('S-01', { situacao: 'atende' })] }],
    });
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
