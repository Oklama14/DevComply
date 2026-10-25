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

/**
 * Gravidade com exemplos. Os exemplos calibram a IA: sem eles, a mesma resposta saia
 * "Grave" numa geracao e "Catastrofica" na outra. Eles sao a politica do DevComply
 * (nao estao nos artigos do LGPD-Check) e aparecem na legenda do PDF.
 */
export const CRITERIOS_GRAVIDADE: Record<
  Gravidade,
  { nome: string; criterio: string; exemplos: string }
> = {
  leve: {
    nome: 'Leve',
    criterio:
      'Falha de forma ou de documentação, sem prejuízo direto ao titular.',
    exemplos:
      'política sem data de atualização; processo que funciona, mas não está documentado; registro de consentimento sem a versão do texto aceito.',
  },
  grave: {
    nome: 'Grave',
    criterio: 'Compromete um direito do titular ou expõe dados a risco.',
    exemplos:
      'direito do titular atendido só por pedido manual e demorado; falta do registro das operações de tratamento; encarregado não nomeado ou sem canal de contato publicado.',
  },
  catastrofica: {
    nome: 'Catastrófica',
    criterio:
      'Viola diretamente a LGPD, expõe dados sensíveis ou impede o titular de exercer seus direitos.',
    exemplos:
      'dados sensíveis (saúde, biometria) ou de crianças sem proteção; nenhum meio para o titular exercer um direito; nenhum procedimento para comunicar incidentes à ANPD e aos titulares; tratamento sem base legal.',
  },
};

/** Desempate entre dois niveis de gravidade (vai no pedido a IA). */
export const REGRA_DESEMPATE_GRAVIDADE =
  'Na dúvida entre dois níveis, escolha o mais grave quando o item envolver dados sensíveis ou de crianças; nos outros casos, o menos grave.';
