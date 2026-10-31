/**
 * Perguntas frequentes da landing. Ficam aqui, e nao no template, porque o mesmo texto
 * vai para os dados estruturados (FAQPage, em app.routes.ts): o que o buscador e as IAs
 * leem tem de ser o que a pagina mostra.
 */
export interface PerguntaFrequente {
  pergunta: string;
  resposta: string;
}

export const PERGUNTAS_FREQUENTES: PerguntaFrequente[] = [
  {
    pergunta: 'O DevComply substitui um advogado ou o encarregado (DPO)?',
    resposta:
      'Não. O relatório é apoio técnico para a equipe de desenvolvimento, não parecer jurídico ' +
      'nem atestado de conformidade.',
  },
  {
    pergunta: 'Preciso enviar o código do meu sistema?',
    resposta:
      'Não. O DevComply recebe só as respostas do checklist. Para conferir o código, a lgpd-scan ' +
      'roda na sua máquina, sem enviar o código para lugar nenhum.',
  },
  {
    pergunta: 'A IA vê as minhas respostas?',
    resposta:
      'Sim. Ao gerar o relatório, as respostas dos itens marcados vão para o Google Gemini. Você ' +
      'pode cadastrar a sua própria chave do Gemini em Configurações.',
  },
  {
    pergunta: 'De onde vêm as perguntas do checklist?',
    resposta:
      'Do LGPD-Check, um checklist de inspeção publicado no SBES 2021 e avaliado no SBQS 2023, ' +
      'eventos da Sociedade Brasileira de Computação.',
  },
  {
    pergunta: 'Posso apagar a minha conta e os meus dados?',
    resposta:
      'Sim, em Perfil ou em Configurações. A exclusão é imediata e apaga projetos, respostas e ' +
      'histórico. Antes, dá para baixar uma cópia dos seus dados em JSON.',
  },
];

/** As mesmas perguntas em schema.org (FAQPage), para o JSON-LD da landing. */
export function faqJsonLd(): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: PERGUNTAS_FREQUENTES.map(({ pergunta, resposta }) => ({
      '@type': 'Question',
      name: pergunta,
      acceptedAnswer: { '@type': 'Answer', text: resposta },
    })),
  };
}
