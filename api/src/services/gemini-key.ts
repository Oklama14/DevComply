/**
 * Conferencia da chave do Gemini cadastrada pelo usuario.
 *
 * O DevComply so fala com o Google Gemini. Antes, qualquer texto era salvo e o erro
 * so aparecia no relatorio; e uma chave de outra IA (OpenAI, Anthropic, DeepSeek)
 * era enviada ao Google no cabecalho de cada pedido.
 */

/** Nome do servico quando a chave tem o formato de outra IA; null se nao reconhece. */
export function identificarOutroProvedor(chave: string): string | null {
  const k = chave.trim();
  if (/^sk-ant-/i.test(k)) return 'Anthropic (Claude)';
  if (/^sk-(proj|svcacct|admin)-/i.test(k)) return 'OpenAI (ChatGPT)';
  // DeepSeek: "sk-" + 32 caracteres hexadecimais
  if (/^sk-[a-f0-9]{32}$/i.test(k)) return 'DeepSeek';
  if (/^sk-/i.test(k)) return 'OpenAI (ChatGPT) ou DeepSeek';
  if (/^xai-/i.test(k)) return 'xAI (Grok)';
  if (/^gsk_/i.test(k)) return 'Groq';
  return null;
}

export type ResultadoVerificacao = 'valida' | 'invalida' | 'indeterminada';

const URL_MODELOS =
  'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1';
const TIMEOUT_VERIFICACAO_MS = 8_000;

/**
 * Pergunta ao Google se a chave vale, listando um modelo (nao gera texto nem gasta
 * a cota de geracao). A chave vai no cabecalho, nunca na URL, para nao parar em log.
 * - 200 ou 429 (chave certa, so sem cota agora): valida;
 * - 400, 401 ou 403: invalida;
 * - erro do Google (5xx), rede ou demora: indeterminada (salva com aviso).
 */
export async function verificarChaveGemini(
  chave: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResultadoVerificacao> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_VERIFICACAO_MS);
  try {
    const res = await fetchImpl(URL_MODELOS, {
      headers: { 'x-goog-api-key': chave.trim() },
      signal: controle.signal,
    });
    if (res.ok || res.status === 429) return 'valida';
    if ([400, 401, 403].includes(res.status)) return 'invalida';
    return 'indeterminada';
  } catch {
    return 'indeterminada';
  } finally {
    clearTimeout(timer);
  }
}
