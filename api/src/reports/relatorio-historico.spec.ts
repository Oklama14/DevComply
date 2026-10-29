import { guardarRelatorio, restaurarRelatorio, resumirRelatorio } from './relatorio-historico';
import { ItemRelatorio, Relatorio } from './relatorio.types';

const item = (codigo: string, extra: Partial<ItemRelatorio>): ItemRelatorio => ({
  codigo,
  pergunta: `Pergunta ${codigo}`,
  origem: 'ia',
  pontosFortes: [],
  lacunas: [],
  recomendacoes: [],
  evidencias: [],
  ...extra,
});

const relatorio: Relatorio = {
  projeto: 'Loja',
  modelo: 'gemini-x',
  geradoEm: new Date('2026-10-29T15:00:00.000Z'),
  resumoExecutivo: 'Resumo.',
  secoes: [
    {
      titulo: 'Consentimento',
      itens: [
        item('C-01', { situacao: 'atende' }),
        item('C-03', { situacao: 'nao_atende', gravidade: 'catastrofica' }),
      ],
    },
    {
      titulo: 'Direitos',
      itens: [
        item('D-03', { situacao: 'parcial', gravidade: 'grave' }),
        item('D-07', { origem: 'nao_marcado', situacao: 'nao_atende' }),
        item('D-04', { origem: 'nao_avaliado' }),
        item('D-08', { situacao: 'parcial' }), // sem gravidade: conta como leve
      ],
    },
  ],
};

describe('historico de relatorios', () => {
  it('resume: indice, contagem, lacunas por gravidade e codigos pendentes', () => {
    const { pontuacao, resumo } = resumirRelatorio(relatorio);

    // 1 atende de 5 avaliados (o nao avaliado fica fora da conta).
    expect(pontuacao).toBe(20);
    expect(resumo).toEqual({
      total: 6,
      atende: 1,
      parcial: 2,
      nao_atende: 2,
      nao_avaliado: 1,
      nao_marcados: 1,
      lacunas: { catastrofica: 1, grave: 1, leve: 1, nao_implementado: 1 },
      pendentes: ['C-03', 'D-03', 'D-07', 'D-08'],
    });
  });

  it('sem item avaliado, o indice fica nulo em vez de 0%', () => {
    const vazio: Relatorio = {
      geradoEm: new Date(),
      secoes: [{ titulo: 'X', itens: [item('S-01', { origem: 'nao_avaliado' })] }],
    };
    expect(resumirRelatorio(vazio).pontuacao).toBeNull();
  });

  it('guarda e restaura o relatorio sem perder nada (a data volta a ser Date)', () => {
    const guardado = guardarRelatorio(relatorio);
    expect(guardado.versao).toBe(1);
    expect(typeof guardado.geradoEm).toBe('string');

    // Ida e volta pelo banco: jsonb e JSON.
    const restaurado = restaurarRelatorio(JSON.parse(JSON.stringify(guardado)));
    expect(restaurado).toEqual(relatorio);
    expect(restaurado.geradoEm).toBeInstanceOf(Date);
  });
});
