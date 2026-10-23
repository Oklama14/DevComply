/**
 * Catalogo do checklist LGPD do DevComply, baseado no LGPD-Check:
 *
 * - MENDES, J.; VIANA, D.; RIVERO, L. Developing an Inspection Checklist for the
 *   Adequacy Assessment of Software Systems to Quality Attributes of the Brazilian
 *   General Data Protection Law: An Initial Proposal. SBES 2021.
 *   https://sol.sbc.org.br/index.php/sbes/article/view/18822
 * - NEITZKE, C. et al. Enhancing LGPD Compliance: Evaluating a Checklist for LGPD
 *   Quality Attributes within a Government Office. SBQS 2023.
 *   https://sol.sbc.org.br/index.php/sbqs/article/view/27108
 *
 * `LGPD_CHECK_ITENS` guarda a versao consolidada com 61 itens (47 obrigatorios +
 * 14 opcionais), conforme o Apendice D da dissertacao de C. A. Neitzke (UFMA, 2025),
 * que traz o checklist avaliado no SBQS 2023, incluindo os itens S-13 a S-17.
 *
 * O checklist exibido no DevComply usa so `CODIGOS_NO_CHECKLIST`: 3 itens
 * obrigatorios por secao (18 no total). Para incluir mais perguntas, acrescente o
 * codigo nessa lista e crie uma migration que chame `aplicarCatalogoLgpdCheck`.
 *
 * Adaptacoes do DevComply (nao estao nos artigos):
 * - A categoria T (Transparencia) do LGPD-Check foi dividida em duas secoes:
 *   "Transparencia de dados" (o que o titular e informado) e "Processamento de
 *   dados" (finalidade, base legal, qualidade, legitimo interesse, registro e
 *   anonimizacao). Os codigos originais (T-01...T-14) foram mantidos.
 * - "Direitos do titular" aparece como "Direitos dos usuarios".
 * - A coluna `referencia` (artigos da LGPD por item) e um mapeamento do DevComply;
 *   o LGPD-Check nao traz artigo por item.
 * - R-03: o prazo de comunicacao de incidente foi atualizado para 3 dias uteis
 *   (Resolucao CD/ANPD n. 15/2024).
 *
 * Para alterar o catalogo em producao, crie uma nova migration que chame
 * `aplicarCatalogoLgpdCheck` (a funcao e idempotente: faz upsert por `codigo`).
 */

export type ChaveCategoria =
  | 'transparencia'
  | 'processamento'
  | 'consentimento'
  | 'direitos'
  | 'seguranca'
  | 'responsabilidade';

export interface CategoriaCatalogo {
  chave: ChaveCategoria;
  titulo: string;
  artigo: string;
  descricao: string;
  ordem: number;
  /** Titulos antigos desta categoria (renomeados in-place para preservar ids). */
  titulosAntigos?: string[];
}

export interface ItemCatalogo {
  codigo: string;
  categoria: ChaveCategoria;
  pergunta: string;
  referencia: string;
  obrigatorio: boolean;
  recomendacao: string;
}

export const LGPD_CHECK_CATEGORIAS: CategoriaCatalogo[] = [
  {
    chave: 'transparencia',
    titulo: 'Transparência de dados',
    artigo: 'Arts. 6º e 9º',
    descricao:
      'Informação clara, prévia e acessível ao titular sobre o tratamento dos seus dados.',
    ordem: 1,
    titulosAntigos: ['Princípios de Transparência'],
  },
  {
    chave: 'processamento',
    titulo: 'Processamento de dados',
    artigo: 'Arts. 6º, 7º, 10, 12 e 37',
    descricao:
      'Finalidade, base legal, qualidade dos dados, legítimo interesse, registro das operações e anonimização.',
    ordem: 2,
  },
  {
    chave: 'consentimento',
    titulo: 'Consentimento do titular',
    artigo: 'Arts. 8º, 9º e 14',
    descricao:
      'Coleta, registro, revogação e atualização do consentimento, inclusive de crianças e adolescentes.',
    ordem: 3,
  },
  {
    chave: 'direitos',
    titulo: 'Direitos dos usuários',
    artigo: 'Arts. 18 a 20',
    descricao:
      'Mecanismos para o titular exercer acesso, correção, portabilidade, eliminação, oposição e revisão de decisões automatizadas.',
    ordem: 4,
  },
  {
    chave: 'seguranca',
    titulo: 'Segurança de dados',
    artigo: 'Arts. 33 e 46 a 50',
    descricao:
      'Medidas técnicas e administrativas de proteção, controle de acesso, transferência internacional e resposta a incidentes.',
    ordem: 5,
  },
  {
    chave: 'responsabilidade',
    titulo: 'Responsabilidade do controlador',
    artigo: 'Arts. 38, 41, 48 e 50',
    descricao:
      'Encarregado (DPO), relatório de impacto, comunicação de incidentes e capacitação da equipe.',
    ordem: 6,
  },
];

export const LGPD_CHECK_ITENS: ItemCatalogo[] = [
  // ===== Transparência de dados (LGPD-Check, categoria T) =====
  {
    codigo: 'T-03',
    categoria: 'transparencia',
    pergunta: 'O sistema informa ao titular as finalidades do tratamento de dados pessoais?',
    referencia: 'Art. 9º, I',
    obrigatorio: true,
    recomendacao:
      'Disponibilize ao titular a Política de Privacidade e/ou o Termo de Consentimento, detalhando as finalidades do tratamento.',
  },
  {
    codigo: 'T-05',
    categoria: 'transparencia',
    pergunta:
      'O sistema informa ao titular a forma e a duração do tratamento, de forma gratuita e facilitada?',
    referencia: 'Art. 6º, IV; Art. 9º, II',
    obrigatorio: true,
    recomendacao:
      'Descreva na Política de Privacidade e no Termo de Consentimento como o tratamento será realizado e por quanto tempo, mantendo essa informação sempre disponível ao titular.',
  },
  {
    codigo: 'T-06',
    categoria: 'transparencia',
    pergunta:
      'O sistema permite ao titular consultar a integralidade dos seus dados pessoais, de forma gratuita e facilitada?',
    referencia: 'Art. 6º, IV; Art. 18, II; Art. 19',
    obrigatorio: true,
    recomendacao:
      'Crie um canal de comunicação entre o titular e a organização para que ele possa solicitar a integralidade dos seus dados. O canal deve ser gratuito e atender sem demora.',
  },
  {
    codigo: 'T-09',
    categoria: 'transparencia',
    pergunta:
      'O sistema fornece ao titular informações sobre o tratamento dos dados e a identificação do controlador?',
    referencia: 'Art. 9º, III e IV',
    obrigatorio: true,
    recomendacao:
      'Informe com clareza na Política de Privacidade e no Termo de Consentimento: a) finalidades do tratamento; b) identidade e contato do controlador; c) dados envolvidos; d) base legal; e) transferências para fora do Brasil; f) prazo de retenção; g) direitos do titular.',
  },
  {
    codigo: 'T-12',
    categoria: 'transparencia',
    pergunta:
      'O sistema informa ao titular e às autoridades competentes sobre as operações de tratamento, especialmente quando baseadas no legítimo interesse?',
    referencia: 'Art. 10, §§ 2º e 3º',
    obrigatorio: true,
    recomendacao:
      'Elabore relatórios das operações de tratamento, sobretudo das baseadas em legítimo interesse, e disponibilize-os quando solicitados pelo titular ou pela ANPD.',
  },
  {
    codigo: 'T-14',
    categoria: 'transparencia',
    pergunta: 'O sistema informa ao titular sobre o tratamento antes da coleta dos dados?',
    referencia: 'Art. 6º, VI; Art. 9º',
    obrigatorio: true,
    recomendacao:
      'Deixe claro e em destaque, por meio de avisos, quais dados pessoais serão coletados, e solicite o consentimento do titular.',
  },

  // ===== Processamento de dados (LGPD-Check, categoria T) =====
  {
    codigo: 'T-01',
    categoria: 'processamento',
    pergunta: 'A organização definiu as finalidades do tratamento de dados pessoais?',
    referencia: 'Art. 6º, I',
    obrigatorio: true,
    recomendacao:
      'Crie um documento de Política de Privacidade e Termo de Consentimento descrevendo as finalidades do tratamento e como os dados serão utilizados.',
  },
  {
    codigo: 'T-02',
    categoria: 'processamento',
    pergunta: 'O tratamento de dados pessoais é realizado com base em uma hipótese legal?',
    referencia: 'Art. 7º; Art. 11',
    obrigatorio: true,
    recomendacao:
      'Explique na Política de Privacidade e no Termo de Consentimento a base legal que justifica o tratamento. Exemplos: I – consentimento do titular; II – cumprimento de obrigação legal ou regulatória pelo controlador. A lista completa está no art. 7º da LGPD (e no art. 11 para dados sensíveis).',
  },
  {
    codigo: 'T-04',
    categoria: 'processamento',
    pergunta:
      'O sistema trata os dados pessoais de acordo com a finalidade apresentada ao titular?',
    referencia: 'Art. 6º, I e II',
    obrigatorio: true,
    recomendacao:
      'Revise o consentimento e corrija os tratamentos que não estão de acordo com o que foi comunicado ao titular.',
  },
  {
    codigo: 'T-07',
    categoria: 'processamento',
    pergunta: 'O sistema armazena com exatidão e clareza os dados pessoais coletados?',
    referencia: 'Art. 6º, V',
    obrigatorio: true,
    recomendacao:
      'Na coleta, garanta que os dados sejam informados corretamente, por exemplo com validação de campos nos formulários (CPF, CEP e outros).',
  },
  {
    codigo: 'T-08',
    categoria: 'processamento',
    pergunta:
      'O sistema mantém os dados pessoais atualizados conforme a necessidade da finalidade do tratamento?',
    referencia: 'Art. 6º, V',
    obrigatorio: true,
    recomendacao:
      'Crie um processo para mapear e revisar os dados pessoais na base. Dados incorretos devem ser corrigidos ou eliminados o quanto antes; quando necessário, peça ao titular que atualize seus dados.',
  },
  {
    codigo: 'T-10',
    categoria: 'processamento',
    pergunta:
      'A organização trata dados com base no legítimo interesse em conformidade com a lei?',
    referencia: 'Art. 7º, IX; Art. 10',
    obrigatorio: true,
    recomendacao:
      'Faça uma avaliação de legítimo interesse demonstrando que: a) existe um interesse legítimo válido; b) o tratamento é estritamente necessário para atendê-lo; c) o tratamento não se sobrepõe nem prejudica os direitos do titular.',
  },
  {
    codigo: 'T-11',
    categoria: 'processamento',
    pergunta:
      'O sistema mantém registro das operações de tratamento, especialmente quando baseadas no legítimo interesse?',
    referencia: 'Art. 37',
    obrigatorio: true,
    recomendacao:
      'Armazene no banco de dados as informações sobre as operações de tratamento, para eventual verificação legal.',
  },
  {
    codigo: 'T-13',
    categoria: 'processamento',
    pergunta:
      'O sistema trata dados pessoais ou sensíveis de forma que não possam ser associados ao titular, quando solicitado?',
    referencia: 'Art. 12; Art. 18, IV',
    obrigatorio: true,
    recomendacao:
      'Analise quais dados devem ser anonimizados ou, em outros casos, pseudonimizados (uma versão semelhante ao dado original, mas que não revela a informação real do titular).',
  },

  // ===== Consentimento do titular (LGPD-Check, categoria C) =====
  {
    codigo: 'C-01',
    categoria: 'consentimento',
    pergunta: 'O sistema permite que o titular dê o consentimento de forma clara e autônoma?',
    referencia: 'Art. 5º, XII; Art. 8º',
    obrigatorio: true,
    recomendacao:
      'No Termo de Consentimento, use linguagem clara e objetiva, evite publicidade enganosa, não use caixas pré-marcadas e ofereça a opção de negar ou revogar o consentimento sem prejuízo.',
  },
  {
    codigo: 'C-02',
    categoria: 'consentimento',
    pergunta:
      'O sistema solicita consentimento específico do titular para comunicar ou compartilhar seus dados com outros controladores?',
    referencia: 'Art. 7º, § 5º',
    obrigatorio: true,
    recomendacao:
      'Seja transparente quanto à finalidade do tratamento. Em especial, no compartilhamento com outros controladores, o titular deve ser informado claramente no formulário de consentimento.',
  },
  {
    codigo: 'C-03',
    categoria: 'consentimento',
    pergunta: 'O sistema armazena o consentimento do titular como prova legal?',
    referencia: 'Art. 8º, § 2º',
    obrigatorio: true,
    recomendacao:
      'Armazene no banco de dados os registros de consentimento do titular, para fins de comprovação.',
  },
  {
    codigo: 'C-04',
    categoria: 'consentimento',
    pergunta: 'O sistema permite que o titular recuse ou revogue o consentimento sem penalidades?',
    referencia: 'Art. 8º, § 5º; Art. 18, IX',
    obrigatorio: true,
    recomendacao:
      'O titular deve ter acesso ao Termo de Consentimento ou ao contrato, com a opção de negar o tratamento dos seus dados.',
  },
  {
    codigo: 'C-05',
    categoria: 'consentimento',
    pergunta:
      'O sistema trata dados de crianças e adolescentes apenas com consentimento específico dos pais ou responsáveis legais, de forma acessível e compreensível?',
    referencia: 'Art. 14, §§ 1º e 6º',
    obrigatorio: true,
    recomendacao:
      'Garanta que somente o responsável legítimo possa dar e atualizar o consentimento, por exemplo autenticando quem consente.',
  },
  {
    codigo: 'C-06',
    categoria: 'consentimento',
    pergunta:
      'O sistema informa o titular sobre mudanças de finalidade e atualizações do consentimento, permitindo revogá-lo se discordar?',
    referencia: 'Art. 8º, § 6º; Art. 9º, § 2º',
    obrigatorio: true,
    recomendacao:
      'Sempre que a finalidade do tratamento mudar, informe o titular e solicite novo consentimento, com a opção de negar o tratamento caso ele discorde da mudança.',
  },
  {
    codigo: 'C-07',
    categoria: 'consentimento',
    pergunta:
      'O sistema apresenta a declaração de consentimento de forma compreensível, acessível e sem termos abusivos?',
    referencia: 'Art. 8º, § 4º; Art. 9º, § 1º',
    obrigatorio: true,
    recomendacao:
      'O Termo de Consentimento deve ser bem redigido, em linguagem de fácil compreensão, e respeitar os direitos do titular.',
  },
  {
    codigo: 'C-08',
    categoria: 'consentimento',
    pergunta:
      'O sistema informa ao titular todos os seus direitos na declaração de consentimento?',
    referencia: 'Art. 9º, VII',
    obrigatorio: true,
    recomendacao:
      'O Termo de Consentimento e a Política de Privacidade devem informar ao titular os direitos que ele possui.',
  },

  // ===== Direitos dos usuários (LGPD-Check, categoria D) =====
  {
    codigo: 'D-01',
    categoria: 'direitos',
    pergunta:
      'O sistema armazena os dados pessoais em formato que facilite o acesso pelo titular?',
    referencia: 'Art. 19, § 1º',
    obrigatorio: true,
    recomendacao:
      'Armazene os dados em formatos estruturados e legíveis por máquina, para que aplicações consigam identificar e extrair os dados pessoais. Exemplos: CSV, XML e JSON.',
  },
  {
    codigo: 'D-02',
    categoria: 'direitos',
    pergunta:
      'O sistema oferece ao titular meios para registrar reclamações sobre a proteção e o tratamento dos seus dados?',
    referencia: 'Art. 18, § 1º',
    obrigatorio: true,
    recomendacao:
      'Divulgue o contato do encarregado (DPO) ou do responsável pelo tratamento na Política de Privacidade ou em uma página dedicada a reclamações.',
  },
  {
    codigo: 'D-03',
    categoria: 'direitos',
    pergunta: 'O sistema fornece ao titular cópia eletrônica integral dos seus dados pessoais?',
    referencia: 'Art. 19, § 3º',
    obrigatorio: true,
    recomendacao:
      'Envie os dados solicitados diretamente ao titular ou ofereça uma ferramenta para que ele mesmo os extraia.',
  },
  {
    codigo: 'D-04',
    categoria: 'direitos',
    pergunta: 'O sistema permite que o titular atualize seus dados pessoais?',
    referencia: 'Art. 18, III',
    obrigatorio: true,
    recomendacao:
      'Conforme a finalidade, será preciso solicitar a atualização dos dados. Recomenda-se um mecanismo para que o próprio titular atualize seus dados.',
  },
  {
    codigo: 'D-05',
    categoria: 'direitos',
    pergunta:
      'O sistema utiliza apenas dados pertinentes e adequados à finalidade pretendida?',
    referencia: 'Art. 6º, III; Art. 18, IV',
    obrigatorio: true,
    recomendacao:
      'Minimize os dados pessoais, usando apenas os relevantes para o tratamento. Anonimize os desnecessários e bloqueie ou elimine os irrelevantes.',
  },
  {
    codigo: 'D-06',
    categoria: 'direitos',
    pergunta:
      'O sistema permite a portabilidade dos dados a outro fornecedor, mediante requisição do titular?',
    referencia: 'Art. 18, V',
    obrigatorio: true,
    recomendacao:
      'Armazene os dados em formato legível por máquina e acessível, para que as informações do titular possam ser exportadas a pedido dele.',
  },
  {
    codigo: 'D-07',
    categoria: 'direitos',
    pergunta: 'O sistema permite a eliminação dos dados pessoais a pedido do titular?',
    referencia: 'Art. 18, VI',
    obrigatorio: true,
    recomendacao:
      'Crie um mecanismo para que o titular solicite a remoção dos seus dados pessoais.',
  },
  {
    codigo: 'D-08',
    categoria: 'direitos',
    pergunta: 'O sistema elimina os dados pessoais do titular após o término do tratamento?',
    referencia: 'Arts. 15 e 16',
    obrigatorio: true,
    recomendacao:
      'Elimine os dados pessoais depois de cumprida a finalidade, dentro do prazo estabelecido.',
  },
  {
    codigo: 'D-09',
    categoria: 'direitos',
    pergunta:
      'O sistema informa as entidades públicas e privadas com as quais compartilha os dados pessoais?',
    referencia: 'Art. 18, VII',
    obrigatorio: true,
    recomendacao:
      'Registre as entidades e as operações realizadas, como compartilhamentos, para fins de verificação legal, e disponibilize essas informações quando solicitadas.',
  },
  {
    codigo: 'D-10',
    categoria: 'direitos',
    pergunta:
      'O sistema informa ao titular a possibilidade de não fornecer consentimento e as consequências da negativa?',
    referencia: 'Art. 18, VIII',
    obrigatorio: true,
    recomendacao:
      'O formulário de consentimento deve oferecer a opção de recusa e explicar as consequências caso o titular não consinta.',
  },
  {
    codigo: 'D-11',
    categoria: 'direitos',
    pergunta:
      'O sistema informa ao titular quando o tratamento é condição para o fornecimento de produto, serviço ou exercício de direito?',
    referencia: 'Art. 9º, § 3º',
    obrigatorio: true,
    recomendacao:
      'Deixe claros os objetivos e os pré-requisitos do tratamento no momento do consentimento.',
  },
  {
    codigo: 'D-12',
    categoria: 'direitos',
    pergunta: 'O sistema permite que o titular se oponha ao tratamento de forma fácil?',
    referencia: 'Art. 18, § 2º',
    obrigatorio: true,
    recomendacao:
      'Ofereça um mecanismo para o titular revogar o consentimento. Revogado o consentimento, as informações do titular não podem mais ser tratadas.',
  },
  {
    codigo: 'D-13',
    categoria: 'direitos',
    pergunta:
      'O sistema informa ao titular os motivos quando não é possível atender de imediato ao exercício de um direito?',
    referencia: 'Art. 18, § 4º',
    obrigatorio: true,
    recomendacao:
      'Quando não for possível atender de imediato, responda ao titular: I – informando que a organização não é agente de tratamento e indicando, sempre que possível, o agente responsável; ou II – indicando as razões de fato ou de direito que impedem a adoção imediata da providência.',
  },
  {
    codigo: 'D-14',
    categoria: 'direitos',
    pergunta:
      'O sistema informa ao titular quando decisões são tomadas com base em tratamento automatizado, inclusive perfilamento?',
    referencia: 'Art. 20, § 1º',
    obrigatorio: true,
    recomendacao:
      'Informe ao titular quais decisões automatizadas serão tomadas e, se solicitado, forneça os registros dessas informações.',
  },
  {
    codigo: 'D-15',
    categoria: 'direitos',
    pergunta:
      'O sistema oferece ao titular a opção de contestar ou solicitar revisão de decisões automatizadas?',
    referencia: 'Art. 20',
    obrigatorio: true,
    recomendacao:
      'Se solicitado, revise a decisão automatizada contestada, o que pode envolver suspender o tratamento e obter novo consentimento para essa finalidade.',
  },

  // ===== Segurança de dados (LGPD-Check, categoria S) =====
  {
    codigo: 'S-01',
    categoria: 'seguranca',
    pergunta:
      'O sistema trata os dados com segurança, incluindo proteção contra acessos não autorizados?',
    referencia: 'Art. 6º, VII; Art. 46',
    obrigatorio: true,
    recomendacao:
      'Permita que somente pessoas autorizadas leiam, alterem ou excluam dados no sistema, por exemplo com uma lista de controle de acesso.',
  },
  {
    codigo: 'S-02',
    categoria: 'seguranca',
    pergunta:
      'O sistema cumpre as regras de transferência internacional, enviando dados apenas a países com nível adequado de proteção?',
    referencia: 'Art. 33',
    obrigatorio: true,
    recomendacao:
      'Verifique se o país de destino oferece proteção igual ou superior à da LGPD e/ou se o destinatário comprova as mesmas garantias por normas ou certificações. Confirme também se a ANPD autoriza a operação.',
  },
  {
    codigo: 'S-03',
    categoria: 'seguranca',
    pergunta: 'O sistema informa ao titular sobre transferências internacionais de dados?',
    referencia: 'Art. 33, VIII',
    obrigatorio: true,
    recomendacao:
      'Inclua na Política de Privacidade e no Termo de Consentimento as informações sobre a transferência de dados para outros países.',
  },
  {
    codigo: 'S-04',
    categoria: 'seguranca',
    pergunta: 'O sistema usa mecanismos para evitar dano, destruição ou perda de dados?',
    referencia: 'Art. 46',
    obrigatorio: true,
    recomendacao:
      'Crie mecanismos contra perda e dano dos dados pessoais, como backup, armazenamento em nuvem e outras medidas que protejam a informação original.',
  },
  {
    codigo: 'S-05',
    categoria: 'seguranca',
    pergunta:
      'O sistema aplica medidas de proteção adequadas aos dados pessoais sensíveis?',
    referencia: 'Art. 11; Art. 46',
    obrigatorio: true,
    recomendacao:
      'Implemente uma camada adicional de segurança para dados sensíveis, como criptografia, controle de acesso e outras técnicas recomendadas.',
  },
  {
    codigo: 'S-06',
    categoria: 'seguranca',
    pergunta: 'O sistema adota boas práticas de privacidade, como privacy by design?',
    referencia: 'Art. 46, § 2º',
    obrigatorio: false,
    recomendacao:
      'Como boa prática de desenvolvimento e conformidade, adote a metodologia de privacy by design.',
  },
  {
    codigo: 'S-07',
    categoria: 'seguranca',
    pergunta: 'O sistema realiza o mapeamento dos dados pessoais e o mantém seguro?',
    referencia: 'Art. 37; Art. 50',
    obrigatorio: false,
    recomendacao: 'Organize e documente os locais onde os dados são coletados e armazenados.',
  },
  {
    codigo: 'S-08',
    categoria: 'seguranca',
    pergunta:
      'O sistema garante a confidencialidade dos dados por meio de medidas técnicas adequadas?',
    referencia: 'Art. 46; Art. 47',
    obrigatorio: false,
    recomendacao:
      'Proteja os dados armazenados e em trânsito contra acesso não autorizado, por exemplo com autenticação e controle de acesso.',
  },
  {
    codigo: 'S-09',
    categoria: 'seguranca',
    pergunta:
      'O sistema garante a integridade dos dados pessoais, impedindo alterações indevidas?',
    referencia: 'Art. 46',
    obrigatorio: false,
    recomendacao: 'Verifique a integridade dos dados durante a coleta e o tratamento.',
  },
  {
    codigo: 'S-10',
    categoria: 'seguranca',
    pergunta:
      'O sistema mantém logs de auditoria de conformidade e fornece informações ao titular quando solicitado?',
    referencia: 'Art. 6º, X; Art. 37',
    obrigatorio: false,
    recomendacao: 'Documente os dados das auditorias realizadas para fornecê-los ao titular.',
  },
  {
    codigo: 'S-11',
    categoria: 'seguranca',
    pergunta:
      'A organização tem um plano de resposta a incidentes de privacidade e segurança?',
    referencia: 'Art. 50, § 2º, I, g',
    obrigatorio: false,
    recomendacao: 'Documente um plano para tratar falhas e incidentes de segurança.',
  },
  {
    codigo: 'S-12',
    categoria: 'seguranca',
    pergunta:
      'O sistema possui certificações ou selos que demonstrem conformidade com normas de proteção de dados?',
    referencia: 'Art. 50',
    obrigatorio: false,
    recomendacao:
      'Busque certificações que comprovem um código de conduta ou política de segurança alinhados às leis de proteção de dados, como ISO/IEC 27001 e ISO/IEC 27701.',
  },
  {
    codigo: 'S-13',
    categoria: 'seguranca',
    pergunta:
      'O sistema implementa um processo de cadastro, cancelamento e provisionamento para o controle de acesso?',
    referencia: 'Art. 46; Art. 49',
    obrigatorio: false,
    recomendacao:
      'Implemente cadastro seguro com credenciais únicas e senhas com hash e salt. Remova usuários que não são mais necessários de forma automatizada ou semiautomatizada e gerencie o acesso por papéis e permissões (RBAC).',
  },
  {
    codigo: 'S-14',
    categoria: 'seguranca',
    pergunta:
      'O sistema possui processo formal de registro e cancelamento de usuários dos sistemas que tratam dados pessoais?',
    referencia: 'Art. 46; Art. 49',
    obrigatorio: false,
    recomendacao:
      'Defina um processo seguro de registro e cancelamento de usuários, com políticas fortes de permissão e senha, auditoria das atividades, treinamento periódico e eliminação de dados após o cancelamento.',
  },
  {
    codigo: 'S-15',
    categoria: 'seguranca',
    pergunta: 'O sistema possui processo formal para conceder ou revogar direitos de acesso?',
    referencia: 'Art. 46',
    obrigatorio: false,
    recomendacao:
      'Considere uma solução de gestão de identidade e acesso (IAM), com provisionamento, autenticação multifator, gestão de papéis e permissões, auditoria de acessos e desprovisionamento.',
  },
  {
    codigo: 'S-16',
    categoria: 'seguranca',
    pergunta:
      'O sistema mantém registro preciso e atualizado dos usuários autorizados a acessar os sistemas ou os dados pessoais neles contidos?',
    referencia: 'Art. 46',
    obrigatorio: false,
    recomendacao:
      'Mantenha um registro detalhado das atividades dos usuários: quando e por quem um recurso foi acessado, alterado ou excluído. Isso ajuda a rastrear atividades suspeitas e investigar incidentes.',
  },
  {
    codigo: 'S-17',
    categoria: 'seguranca',
    pergunta: 'O sistema protege os dados pessoais em trânsito (SSL/TLS) e em repouso?',
    referencia: 'Art. 46; Art. 49',
    obrigatorio: false,
    recomendacao:
      'Use TLS para proteger os dados em trânsito e criptografe os dados armazenados: em disco (ex.: BitLocker, FileVault), no banco de dados (ex.: TDE) ou na aplicação (bibliotecas de criptografia antes de gravar).',
  },

  // ===== Responsabilidade do controlador (LGPD-Check, categoria R) =====
  {
    codigo: 'R-01',
    categoria: 'responsabilidade',
    pergunta:
      'A organização indica um encarregado (DPO) responsável pelo tratamento de dados?',
    referencia: 'Art. 41',
    obrigatorio: true,
    recomendacao:
      'Indique um encarregado (pessoa física ou jurídica) como canal de comunicação entre o controlador, os titulares e a ANPD. A ANPD pode estabelecer normas complementares, inclusive hipóteses de dispensa conforme a natureza e o porte da organização.',
  },
  {
    codigo: 'R-02',
    categoria: 'responsabilidade',
    pergunta:
      'A organização divulga publicamente, de forma clara e objetiva, a identidade e o contato do encarregado?',
    referencia: 'Art. 41, § 1º',
    obrigatorio: true,
    recomendacao:
      'Informe a identidade e o contato do encarregado de forma clara na Política de Privacidade e no Termo de Consentimento, com fácil acesso para os titulares e a ANPD.',
  },
  {
    codigo: 'R-03',
    categoria: 'responsabilidade',
    pergunta:
      'A organização comunica à ANPD e ao titular a ocorrência de incidente de segurança que possa acarretar risco ou dano relevante?',
    referencia: 'Art. 48',
    obrigatorio: true,
    recomendacao:
      'Em caso de incidente, comunique o titular e a ANPD. Pelo Regulamento de Comunicação de Incidente de Segurança (Resolução CD/ANPD nº 15/2024), o prazo é de 3 dias úteis a partir do conhecimento do incidente. O conteúdo mínimo da comunicação está no art. 48, § 1º, da LGPD.',
  },
  {
    codigo: 'R-04',
    categoria: 'responsabilidade',
    pergunta:
      'A organização realiza avaliação de impacto quando o tratamento envolve alto risco aos direitos e liberdades dos titulares?',
    referencia: 'Art. 38',
    obrigatorio: true,
    recomendacao:
      'Realize a avaliação de impacto quando houver alto risco no tratamento e revise-a periodicamente, sobretudo se o grau de risco for elevado.',
  },
  {
    codigo: 'R-05',
    categoria: 'responsabilidade',
    pergunta:
      'A organização elabora o relatório de impacto à proteção de dados (RIPD) e o fornece à ANPD quando solicitado?',
    referencia: 'Art. 38',
    obrigatorio: true,
    recomendacao:
      'Elabore o RIPD e disponibilize-o quando solicitado. Ele deve conter, no mínimo, os tipos de dados coletados, a metodologia de coleta e de garantia da segurança da informação e a análise do controlador sobre medidas, salvaguardas e mecanismos de mitigação de risco adotados.',
  },
  {
    codigo: 'R-06',
    categoria: 'responsabilidade',
    pergunta: 'A organização registra as atividades do encarregado como prova legal?',
    referencia: 'Art. 6º, X',
    obrigatorio: false,
    recomendacao: 'Armazene e documente o histórico de atividades do encarregado.',
  },
  {
    codigo: 'R-07',
    categoria: 'responsabilidade',
    pergunta: 'A organização capacita os colaboradores sobre conformidade com a LGPD?',
    referencia: 'Art. 41, § 2º, III; Art. 50',
    obrigatorio: false,
    recomendacao:
      'Capacite colaboradores sobre o que a LGPD determina, por meio de treinamentos, cursos, palestras, certificações etc.',
  },
];

/**
 * Itens exibidos no checklist: 3 obrigatorios por secao. Inclui os 3 itens que
 * substituem as perguntas do seed antigo (T-03, T-09 e C-03), para preservar as
 * respostas ja salvas.
 */
export const CODIGOS_NO_CHECKLIST: string[] = [
  // Transparência de dados
  'T-03', 'T-09', 'T-14',
  // Processamento de dados
  'T-02', 'T-04', 'T-11',
  // Consentimento do titular
  'C-01', 'C-03', 'C-04',
  // Direitos dos usuários
  'D-03', 'D-04', 'D-07',
  // Segurança de dados
  'S-01', 'S-04', 'S-05',
  // Responsabilidade do controlador
  'R-01', 'R-03', 'R-04',
];

/** Itens do catalogo que entram no checklist, na ordem do catalogo. */
export const ITENS_NO_CHECKLIST: ItemCatalogo[] = LGPD_CHECK_ITENS.filter((i) =>
  CODIGOS_NO_CHECKLIST.includes(i.codigo),
);

/**
 * Perguntas de exemplo do seed antigo (1 secao, 3 perguntas). Sao convertidas
 * in-place nos itens equivalentes do LGPD-Check para preservar os ids e as
 * respostas ja salvas pelos usuarios. A ordem importa: liberar o codigo T-03
 * antes de reutiliza-lo (evita conflito com o indice unico de `codigo`).
 */
export const PERGUNTAS_LEGADAS: Array<{ pergunta: string; novoCodigo: string }> = [
  {
    pergunta: 'Existe um mecanismo para obter e registrar o consentimento dos usuários?',
    novoCodigo: 'C-03',
  },
  {
    pergunta: 'Os usuários são informados sobre a finalidade específica da coleta de dados?',
    novoCodigo: 'T-03',
  },
  {
    pergunta: 'O sistema possui uma política de privacidade clara e acessível?',
    novoCodigo: 'T-09',
  },
];

type Query = (sql: string, params?: unknown[]) => Promise<any>;

/**
 * Aplica o catalogo de forma idempotente (upsert por titulo/codigo).
 * Recebe uma funcao de query (QueryRunner.query ou DataSource.query) para ser
 * usada tanto na migration (producao) quanto no seed de desenvolvimento.
 */
export async function aplicarCatalogoLgpdCheck(query: Query): Promise<void> {
  // 1) Categorias
  const idsCategoria = new Map<ChaveCategoria, number>();
  for (const cat of LGPD_CHECK_CATEGORIAS) {
    for (const antigo of cat.titulosAntigos ?? []) {
      await query(
        `UPDATE "artigos_lgpd" SET "titulo" = $1::varchar
          WHERE "titulo" = $2::varchar
            AND NOT EXISTS (SELECT 1 FROM "artigos_lgpd" WHERE "titulo" = $1::varchar)`,
        [cat.titulo, antigo],
      );
    }
    await query(
      `UPDATE "artigos_lgpd" SET "artigo" = $2::varchar, "descricao" = $3::text, "ordem" = $4::int
        WHERE "titulo" = $1::varchar`,
      [cat.titulo, cat.artigo, cat.descricao, cat.ordem],
    );
    await query(
      `INSERT INTO "artigos_lgpd" ("titulo", "artigo", "descricao", "ordem")
       SELECT $1::varchar, $2::varchar, $3::text, $4::int
        WHERE NOT EXISTS (SELECT 1 FROM "artigos_lgpd" WHERE "titulo" = $1::varchar)`,
      [cat.titulo, cat.artigo, cat.descricao, cat.ordem],
    );
    const rows: Array<{ id: number }> = await query(
      `SELECT "id" FROM "artigos_lgpd" WHERE "titulo" = $1::varchar ORDER BY "id" LIMIT 1`,
      [cat.titulo],
    );
    idsCategoria.set(cat.chave, Number(rows[0].id));
  }

  // 2) Perguntas legadas -> itens equivalentes (preserva ids e respostas)
  for (const legado of PERGUNTAS_LEGADAS) {
    await query(
      `UPDATE "checklist_perguntas" SET "codigo" = $1::varchar
        WHERE "pergunta" = $2::text
          AND NOT EXISTS (SELECT 1 FROM "checklist_perguntas" WHERE "codigo" = $1::varchar)`,
      [legado.novoCodigo, legado.pergunta],
    );
  }

  // 3) Itens do checklist (upsert por codigo)
  for (const [ordem, item] of ITENS_NO_CHECKLIST.entries()) {
    const params = [
      item.codigo,
      item.pergunta,
      idsCategoria.get(item.categoria),
      item.referencia,
      item.obrigatorio,
      ordem + 1,
      item.recomendacao,
    ];
    await query(
      `UPDATE "checklist_perguntas"
          SET "pergunta" = $2::text, "artigo_id" = $3::int, "referencia" = $4::varchar,
              "obrigatorio" = $5::boolean, "ordem" = $6::int, "dica" = $7::text
        WHERE "codigo" = $1::varchar`,
      params,
    );
    await query(
      `INSERT INTO "checklist_perguntas"
              ("codigo", "pergunta", "artigo_id", "referencia", "obrigatorio", "ordem", "dica")
       SELECT $1::varchar, $2::text, $3::int, $4::varchar, $5::boolean, $6::int, $7::text
        WHERE NOT EXISTS (SELECT 1 FROM "checklist_perguntas" WHERE "codigo" = $1::varchar)`,
      params,
    );
  }
}
