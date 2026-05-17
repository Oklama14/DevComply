import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  // Isso garante que todas as requisições que chegam aos controladores
  // e que usam DTOs com decoradores de validação sejam automaticamente validadas.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Lança um erro se propriedades extras forem enviadas
      transform: true, // Transforma os tipos dos dados (ex: string de ID para number)
    }),
  );

  // Escutar na porta do ambiente (Railway) ou 3000 (Local)
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();