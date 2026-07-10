import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';

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

  // Compressao (GZIP) das respostas
  app.use(compression());

  // CORS dinamico
  const allowedOrigins = ['http://localhost:4200', 'http://client:4200'];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
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
