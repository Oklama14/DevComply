import { identificarOutroProvedor, verificarChaveGemini } from './gemini-key';

const resposta = (status: number) =>
  ({ ok: status >= 200 && status < 300, status }) as Response;

describe('identificarOutroProvedor', () => {
  it.each([
    ['sk-ant-api03-AbC123', 'Anthropic (Claude)'],
    ['sk-proj-AbC123', 'OpenAI (ChatGPT)'],
    ['sk-0123456789abcdef0123456789abcdef', 'DeepSeek'],
    [
      'sk-AbCdEf1234567890AbCdEf1234567890AbCdEf12345678',
      'OpenAI (ChatGPT) ou DeepSeek',
    ],
    ['xai-123', 'xAI (Grok)'],
    ['gsk_123', 'Groq'],
  ])('%s -> %s', (chave, provedor) => {
    expect(identificarOutroProvedor(chave)).toBe(provedor);
  });

  it('chave do Gemini nao e de outro provedor', () => {
    expect(
      identificarOutroProvedor('AIzaSyD-1234567890abcdefghijklmnopqrstu'),
    ).toBeNull();
  });
});

describe('verificarChaveGemini', () => {
  it('manda a chave no cabecalho, nunca na URL', async () => {
    const f = jest.fn().mockResolvedValue(resposta(200));
    await verificarChaveGemini(' AIzaChave ', f as any);
    const [url, init] = f.mock.calls[0];
    expect(url).not.toContain('AIzaChave');
    expect(init.headers['x-goog-api-key']).toBe('AIzaChave');
  });

  it.each([
    [200, 'valida'],
    [429, 'valida'],
    [400, 'invalida'],
    [401, 'invalida'],
    [403, 'invalida'],
    [500, 'indeterminada'],
    [503, 'indeterminada'],
  ])('HTTP %i -> %s', async (status, esperado) => {
    const f = jest.fn().mockResolvedValue(resposta(status));
    await expect(verificarChaveGemini('AIza', f as any)).resolves.toBe(
      esperado,
    );
  });

  it('falha de rede -> indeterminada', async () => {
    const f = jest.fn().mockRejectedValue(new TypeError('fetch failed'));
    await expect(verificarChaveGemini('AIza', f as any)).resolves.toBe(
      'indeterminada',
    );
  });
});
