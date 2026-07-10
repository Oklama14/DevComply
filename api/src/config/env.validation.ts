/**
 * Validacao das variaveis de ambiente no boot. Falha rapido (e com mensagem
 * clara) apenas para o que e essencial: JWT e conexao de banco. Coisas de
 * feature opcional (IA) apenas avisam, sem impedir o boot.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];

  if (!config.JWT_SECRET || String(config.JWT_SECRET).trim() === '') {
    errors.push('JWT_SECRET e obrigatorio.');
  }

  const hasUrl = !!config.DATABASE_URL;
  const hasDiscrete = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'].every(
    (k) => !!config[k],
  );
  if (!hasUrl && !hasDiscrete) {
    errors.push(
      'Configure DATABASE_URL ou o conjunto DB_HOST/DB_USER/DB_PASS/DB_NAME.',
    );
  }

  if (errors.length) {
    throw new Error(`Configuracao invalida:\n- ${errors.join('\n- ')}`);
  }

  // Opcional: nao bloqueia o boot, apenas avisa.
  if (!config.GOOGLE_API_KEY) {
    console.warn(
      '[env] GOOGLE_API_KEY nao configurado — os relatorios de IA ficarao indisponiveis ate voce definir a chave.',
    );
  }

  return config;
}
