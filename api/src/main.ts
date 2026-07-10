import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Instrumentacao: qualquer erro nao tratado vira log legivel (em vez de queda silenciosa/502).
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // Seguranca de Cabecalhos HTTP
  app.use(helmet());

  // Filtro global de erros (shape consistente + log de 5xx)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Compressao (GZIP) das respostas
  app.use(compression());

  // CORS robusto: tolera barra final e libera *.vercel.app (producao + previews).
  const norm = (v: string) => v.replace(/\/+$/, '');
  const staticOrigins = ['http://localhost:4200', 'http://client:4200'];
  if (process.env.FRONTEND_URL) {
    staticOrigins.push(norm(process.env.FRONTEND_URL));
  }
  app.enableCors({
    origin: (origin, callback) => {
      // Requests sem Origin (curl, health checks, server-to-server) sao permitidos.
      if (!origin) return callback(null, true);
      const cleaned = norm(origin);
      let host = '';
      try {
        host = new URL(origin).hostname;
      } catch {
        host = '';
      }
      const allowed =
        staticOrigins.includes(cleaned) || /\.vercel\.app$/.test(host);
      if (allowed) return callback(null, true);
      console.warn(`[CORS] origem bloqueada: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Bind em '::' (dual-stack IPv6+IPv4) para o edge do Railway alcancar o container.
  const port = process.env.PORT || 3000;
  await app.listen(port, '::');
  console.log(`API up and listening on port ${port} (dual-stack) - ${await app.getUrl()}`);
}
bootstrap().catch((err) => {
  console.error('[bootstrap] falha ao subir a aplicacao:', err);
  process.exit(1);
});
