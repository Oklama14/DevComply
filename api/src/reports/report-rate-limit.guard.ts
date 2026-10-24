import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const UMA_HORA_MS = 60 * 60 * 1000;
export const RELATORIOS_POR_HORA_PADRAO = 10;

/**
 * Limita quantos relatorios cada usuario gera por hora.
 *
 * Cada relatorio faz ate 6 chamadas ao Gemini (uma por secao). O limite global do
 * ThrottlerGuard e por IP e vale 100 req/min, o que nao protege o custo da chave do
 * sistema. Este guard roda depois do JwtAuthGuard e conta por usuario (janela
 * deslizante de 1 hora). Configuravel por REPORTS_PER_HOUR.
 *
 * Contagem em memoria: suficiente para uma instancia (como o ThrottlerGuard atual).
 * Com mais de uma instancia, mover para um store compartilhado (Redis).
 */
@Injectable()
export class ReportRateLimitGuard implements CanActivate {
  private readonly porUsuario = new Map<number | string, number[]>();
  private readonly limite: number;

  constructor(config: ConfigService) {
    const env = Number(config.get<string>('REPORTS_PER_HOUR'));
    this.limite = Number.isFinite(env) && env > 0 ? env : RELATORIOS_POR_HORA_PADRAO;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (userId == null) return true; // sem usuario, o JwtAuthGuard ja barrou

    const agora = Date.now();
    const recentes = (this.porUsuario.get(userId) ?? []).filter((t) => agora - t < UMA_HORA_MS);

    if (recentes.length >= this.limite) {
      const liberaEmMin = Math.max(1, Math.ceil((recentes[0] + UMA_HORA_MS - agora) / 60000));
      this.porUsuario.set(userId, recentes);
      throw new HttpException(
        `Limite de ${this.limite} relatórios por hora atingido. Tente novamente em ${liberaEmMin} min.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentes.push(agora);
    this.porUsuario.set(userId, recentes);
    return true;
  }
}
