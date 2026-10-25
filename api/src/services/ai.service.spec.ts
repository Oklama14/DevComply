import { ConfigService } from '@nestjs/config';
import {
  AiService,
  IaIndisponivelError,
  MODELOS_GEMINI_PADRAO,
  montarPromptAvaliacao,
} from './ai.service';
import { ItemEntrada } from '../reports/relatorio.types';

const generateContent = jest.fn();
const getGenerativeModel = jest.fn(() => ({ generateContent }));

jest.mock('@google/generative-ai', () => {
  const actual = jest.requireActual('@google/generative-ai');
  return {
    ...actual,
    GoogleGenerativeAI: jest.fn(() => ({ getGenerativeModel })),
  };
});

const config = (env: Record<string, string | undefined>) =>
  ({ get: (k: string) => env[k] }) as unknown as ConfigService;

const marcado: ItemEntrada = {
  codigo: 'S-01',
  secao: 'Segurança de dados',
  pergunta: 'O sistema trata os dados com segurança?',
  referencia: 'Art. 46',
  marcado: true,
  implementacao: 'Login com senha',
  tecnico: 'bcrypt',
};
const naoMarcado: ItemEntrada = {
  ...marcado,
  codigo: 'R-01',
  secao: 'Responsabilidade do controlador',
  pergunta: 'Há DPO?',
  marcado: false,
};
const avaliacao = {
  resumo_executivo: 'r',
  secoes: [],
  itens: [
    {
      codigo: 'S-01',
      situacao: 'atende',
      gravidade: 'nenhuma',
      pontos_fortes: [],
      lacunas: [],
      recomendacoes: [],
    },
  ],
};
const avaliar = (ai: AiService) =>
  ai.avaliarChecklist([marcado], [naoMarcado], undefined, 'Projeto');
const ok = (v: unknown = avaliacao) => ({
  response: { text: () => JSON.stringify(v) },
});
const erroHttp = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

describe('AiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generateContent.mockReset();
    // Sem esperar de verdade entre as tentativas.
    jest
      .spyOn(AiService.prototype as any, 'esperar')
      .mockResolvedValue(undefined);
  });

  it('usa modelos atuais por padrao (nao o gemini-2.5-flash)', () => {
    const ai = new AiService(config({}));
    expect(ai.modelos()).toEqual(MODELOS_GEMINI_PADRAO);
    expect(ai.modelos()).not.toContain('gemini-2.5-flash');
    expect(new AiService(config({ GEMINI_MODEL: 'a, b' })).modelos()).toEqual([
      'a',
      'b',
    ]);
  });

  it('falha com mensagem clara quando nao ha chave (nem do usuario nem global)', async () => {
    const ai = new AiService(config({}));
    await expect(avaliar(ai)).rejects.toMatchObject({ motivo: 'sem-chave' });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('tenta o proximo modelo quando o primeiro esta indisponivel (404)', async () => {
    generateContent
      .mockRejectedValueOnce(erroHttp(404, 'models/x is no longer available'))
      .mockResolvedValueOnce(ok());
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1,m2' }),
    );

    const r = await avaliar(ai);

    expect(r.avaliacao.itens).toHaveLength(1);
    expect(r.modelo).toBe('m2');
    expect(getGenerativeModel.mock.calls.map((c: any[]) => c[0].model)).toEqual(
      ['m1', 'm2'],
    );
  });

  it('traduz chave invalida e limite de uso em mensagens para o usuario', async () => {
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1' }),
    );
    generateContent.mockRejectedValueOnce(
      erroHttp(400, 'API key not valid. Please pass a valid API key.'),
    );
    await expect(avaliar(ai)).rejects.toMatchObject({
      motivo: 'chave-invalida',
    });

    generateContent.mockRejectedValueOnce(
      erroHttp(429, 'Resource has been exhausted'),
    );
    const err = await avaliar(ai).catch((e) => e);
    expect(err).toBeInstanceOf(IaIndisponivelError);
    expect(err.motivo).toBe('cota');
  });

  const umItem = ok();
  const sobrecarga = () =>
    erroHttp(
      503,
      'Error fetching from https://x/models/m1:generateContent: [503 Service Unavailable] The model is overloaded. Please try again later.',
    );
  const modelosChamados = () =>
    getGenerativeModel.mock.calls.map((c: any[]) => c[0].model);

  it('repete a chamada no mesmo modelo quando o Google responde 503 (sobrecarga)', async () => {
    generateContent
      .mockRejectedValueOnce(sobrecarga())
      .mockResolvedValueOnce(umItem);
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1,m2' }),
    );

    await expect(avaliar(ai)).resolves.toMatchObject({ avaliacao: avaliacao });
    expect(modelosChamados()).toEqual(['m1']);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('passa para o proximo modelo quando o primeiro continua sobrecarregado', async () => {
    generateContent
      .mockRejectedValueOnce(sobrecarga())
      .mockRejectedValueOnce(sobrecarga())
      .mockResolvedValueOnce(umItem);
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1,m2' }),
    );

    await expect(avaliar(ai)).resolves.toMatchObject({ avaliacao: avaliacao });
    expect(modelosChamados()).toEqual(['m1', 'm2']);
  });

  it('explica a sobrecarga quando todos os modelos falham com 5xx', async () => {
    generateContent.mockRejectedValue(sobrecarga());
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1,m2' }),
    );

    const err = await avaliar(ai).catch((e) => e);
    expect(err.motivo).toBe('instavel');
    expect(err.message).toContain('erro 503');
    expect(generateContent).toHaveBeenCalledTimes(4); // 2 tentativas x 2 modelos
  });

  it('mostra o motivo do Google quando o pedido e recusado (400 que nao e de chave)', async () => {
    generateContent.mockRejectedValue(
      erroHttp(
        400,
        'Error fetching from https://x: [400 Bad Request] Invalid JSON payload received. Unknown name "format" [{"@type":"x"}]',
      ),
    );
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1,m2' }),
    );

    const err = await avaliar(ai).catch((e) => e);
    expect(err.motivo).toBe('requisicao');
    expect(err.message).toContain(
      'Invalid JSON payload received. Unknown name "format"',
    );
    expect(err.message).not.toContain('@type');
    expect(modelosChamados()).toEqual(['m1', 'm2']);
  });

  it('chave invalida nao repete nem troca de modelo', async () => {
    generateContent.mockRejectedValue(
      erroHttp(400, 'API key not valid. Please pass a valid API key.'),
    );
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1,m2' }),
    );

    await expect(avaliar(ai)).rejects.toMatchObject({
      motivo: 'chave-invalida',
    });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('falha de rede vira mensagem de conexao', async () => {
    generateContent.mockRejectedValue(
      new Error(
        '[GoogleGenerativeAI Error]: Error fetching from https://x: fetch failed',
      ),
    );
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1' }),
    );

    await expect(avaliar(ai)).rejects.toMatchObject({ motivo: 'rede' });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('erro desconhecido traz o detalhe na mensagem (sem precisar abrir o log)', async () => {
    generateContent.mockRejectedValue(
      new TypeError('Cannot read properties of undefined'),
    );
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1' }),
    );

    const err = await avaliar(ai).catch((e) => e);
    expect(err.motivo).toBe('outro');
    expect(err.message).toContain(
      'TypeError: Cannot read properties of undefined',
    );
  });

  it('monta o pedido com os criterios, os itens marcados e os nao marcados so para o resumo', () => {
    const prompt = montarPromptAvaliacao([marcado], [naoMarcado], 'Clínica');
    expect(prompt).toContain('Projeto avaliado: Clínica');
    expect(prompt).toContain('nao_atende:');
    expect(prompt).toContain('catastrofica:');
    expect(prompt).toContain('[S-01] Seção: Segurança de dados');
    expect(prompt).toContain('Implementação descrita: Login com senha');
    const naoMarcados = prompt.slice(prompt.indexOf('<nao_marcados>'));
    expect(naoMarcados).toContain('[R-01] Há DPO?');
    expect(prompt.slice(0, prompt.indexOf('<nao_marcados>'))).not.toContain(
      '[R-01]',
    );
  });

  it('erro de formato quando a IA nao devolve a lista de itens', async () => {
    generateContent.mockResolvedValueOnce(ok({ resumo_executivo: 'x' }));
    const ai = new AiService(
      config({ GOOGLE_API_KEY: 'k', GEMINI_MODEL: 'm1' }),
    );
    await expect(avaliar(ai)).rejects.toMatchObject({ motivo: 'resposta' });
  });
});
