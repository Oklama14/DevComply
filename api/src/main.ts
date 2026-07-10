import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguranca de Cabecalhos HTTP
  app.use(helmet());

  // Compressao (GZIP) das respostas para melhorar performance
  app.use(compression());

  // Habilitar CORS dinamicamente
  const allowedOrigins = ['http://localhost:4200', 'http://client:4200'];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Habilita o ValidationPipe globalmente.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Sem forcar '0.0.0.0': omitindo o host, o Node escuta em '::' (dual-stack
  // IPv6 + IPv4). O edge do Railway alcanca o container via IPv6 na rede
  // interna; ligar apenas em IPv4 deixa o app inalcancavel e gera 502.
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API up and listening on port ${port} (dual-stack) - ${await app.getUrl()}`);
}
bootstrap();
