/**
 * Validacao das variaveis de ambiente no boot. Falha rapido com mensagem clara
 * em vez de subir e quebrar em runtime por falta de configuracao.
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

  const isProd = config.NODE_ENV === 'production';
  if (isProd && !config.GOOGLE_API_KEY) {
    errors.push('GOOGLE_API_KEY e obrigatorio em producao.');
  }

  if (errors.length) {
    throw new Error(`Configuracao invalida:\n- ${errors.join('\n- ')}`);
  }
  return config;
}
