import { Gravidade, Situacao } from './relatorio.types';

/**
 * Criterios da escala do LGPD-Check usados pelo DevComply. O mesmo texto vai no
 * prompt da IA e na legenda do PDF, para quem le o relatorio saber exatamente o
 * que cada nivel significa.
 *
 * As tres situacoes e as tres gravidades seguem o LGPD-Check; a descricao de cada
 * nivel e a forma como o DevComply as aplica (os artigos nao trazem esse texto).
 */
export const CRITERIOS_SITUACAO: Record<
  Situacao,
  { nome: string; criterio: string }
> = {
  atende: {
    nome: 'Atende',
    criterio:
      'A descrição mostra um mecanismo implementado que cobre o requisito por completo, com detalhe técnico ou de processo verificável.',
  },
  parcial: {
    nome: 'Atende parcialmente',
    criterio:
      'Há implementação, mas incompleta: processo manual ou lento, cobre só parte dos dados ou dos titulares, ou falta evidência ou registro.',
  },
  nao_atende: {
    nome: 'Não atende',
    criterio:
      'O requisito não está implementado, ou a descrição não mostra como ele é cumprido (mesmo que o item tenha sido marcado).',
  },
};

export const CRITERIOS_GRAVIDADE: Record<
  Gravidade,
  { nome: string; criterio: string }
> = {
  leve: {
    nome: 'Leve',
    criterio:
      'Falha de forma ou de documentação, sem prejuízo direto ao titular.',
  },
  grave: {
    nome: 'Grave',
    criterio: 'Compromete um direito do titular ou expõe dados a risco.',
  },
  catastrofica: {
    nome: 'Catastrófica',
    criterio:
      'Viola diretamente a LGPD, expõe dados sensíveis ou impede o titular de exercer seus direitos.',
  },
};
