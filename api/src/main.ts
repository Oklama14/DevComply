import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(3000);
}
bootstrap();
