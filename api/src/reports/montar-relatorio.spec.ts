import { itensDeEntrada, montarRelatorio } from './montar-relatorio';
import { AvaliacaoIA } from './relatorio.types';

const entrada = itensDeEntrada([
  {
    categoria_nome: 'Transparência de dados',
    items: [
      {
        codigo: 't-03',
        titulo_item: 'texto do front',
        resposta_implementacao: 'Política no rodapé',
        marcado: true,
      },
      { codigo: 'T-09', titulo_item: 'x', marcado: false },
    ],
  },
  {
    categoria_nome: 'Responsabilidade do controlador',
    items: [
      {
        codigo: 'R-01',
        titulo_item: 'DPO?',
        resposta_implementacao: '',
        marcado: true,
      },
    ],
  },
]);

const ia: AvaliacaoIA = {
  resumo_executivo: '  Resumo.  ',
  secoes: [{ secao: 'transparencia de dados', resumo: 'Boa.' }],
  itens: [
    {
      codigo: 'T-03',
      situacao: 'atende',
      gravidade: 'grave',
      pontos_fortes: ['A', 'A', ' '],
      lacunas: [],
      recomendacoes: [],
      evidencias: ['Print', 'Log', 'Doc'],
    },
    {
      codigo: 'R-01',
      situacao: 'nao_atende',
      gravidade: 'nenhuma',
      pontos_fortes: [],
      lacunas: ['Sem DPO'],
      recomendacoes: ['Nomeie'],
      evidencias: ['Ata'],
    },
    {
      codigo: 'X-99',
      situacao: 'atende',
      gravidade: 'nenhuma',
      pontos_fortes: [],
      lacunas: [],
      recomendacoes: [],
    },
  ],
};

describe('montarRelatorio', () => {
  it('usa a pergunta, o artigo e a recomendacao do catalogo do LGPD-Check', () => {
    expect(entrada[0]).toMatchObject({
      codigo: 'T-03',
      marcado: true,
      referencia: 'Art. 9º, I',
    });
    expect(entrada[0].pergunta).toContain('finalidades');
    expect(entrada[1].recomendacaoCatalogo).toBeTruthy();
  });

  it('junta a avaliacao da IA, mantem a ordem do checklist e ignora itens que nao foram pedidos', () => {
    const r = montarRelatorio(entrada, ia, { projeto: 'P', modelo: 'm' });
    expect(r.secoes.map((s) => s.titulo)).toEqual([
      'Transparência de dados',
      'Responsabilidade do controlador',
    ]);
    expect(r.secoes.flatMap((s) => s.itens.map((i) => i.codigo))).toEqual([
      'T-03',
      'T-09',
      'R-01',
    ]);
    expect(r.resumoExecutivo).toBe('Resumo.');
    expect(r.secoes[0].resumo).toBe('Boa.'); // casou sem acento/maiuscula
    expect(r.secoes[0].referencia).toBe('Arts. 6º e 9º');
  });

  it('atende nao tem gravidade; nao atende sem gravidade valida vira leve; frases limpas', () => {
    const r = montarRelatorio(entrada, ia);
    const [t03, t09] = r.secoes[0].itens;
    const [r01] = r.secoes[1].itens;
    expect(t03).toMatchObject({
      origem: 'ia',
      situacao: 'atende',
      gravidade: undefined,
      pontosFortes: ['A'],
    });
    expect(t09).toMatchObject({
      origem: 'nao_marcado',
      situacao: 'nao_atende',
    });
    expect(t09.gravidade).toBeUndefined();
    // Evidencias: no maximo 2; nada a comprovar quando nao atende.
    expect(t03.evidencias).toEqual(['Print', 'Log']);
    expect(r01).toMatchObject({
      situacao: 'nao_atende',
      gravidade: 'leve',
      lacunas: ['Sem DPO'],
    });
    expect(r.secoes[1].itens[0].evidencias).toEqual([]);
  });

  it('item marcado que a IA nao devolveu sai como nao avaliado', () => {
    const r = montarRelatorio(entrada, { ...ia, itens: [] });
    expect(r.secoes[0].itens[0].origem).toBe('nao_avaliado');
    expect(r.secoes[0].itens[0].situacao).toBeUndefined();
  });
});
