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
 * Contagem de relatorios por usuario (janela deslizante de 1 hora).
 *
 * Fica num provider separado do guard porque o Nest cria a instancia do guard
 * usado em @UseGuards separada da instancia de providers: assim o guard e o
 * controller (que estorna as tentativas que falharam) enxergam o mesmo Map.
 *
 * Contagem em memoria: suficiente para uma instancia (como o ThrottlerGuard atual).
 * Com mais de uma instancia, mover para um store compartilhado (Redis).
 */
@Injectable()
export class ReportQuotaService {
  private readonly porUsuario = new Map<number | string, number[]>();
  readonly limite: number;

  constructor(config: ConfigService) {
    const env = Number(config.get<string>('REPORTS_PER_HOUR'));
    this.limite =
      Number.isFinite(env) && env > 0 ? env : RELATORIOS_POR_HORA_PADRAO;
  }

  /** Registra um relatorio. Se o limite ja foi atingido, devolve em quantos minutos libera. */
  consumir(
    userId: number | string,
  ): { ok: true } | { ok: false; liberaEmMin: number } {
    const agora = Date.now();
    const recentes = (this.porUsuario.get(userId) ?? []).filter(
      (t) => agora - t < UMA_HORA_MS,
    );

    if (recentes.length >= this.limite) {
      this.porUsuario.set(userId, recentes);
      const liberaEmMin = Math.max(
        1,
        Math.ceil((recentes[0] + UMA_HORA_MS - agora) / 60000),
      );
      return { ok: false, liberaEmMin };
    }

    recentes.push(agora);
    this.porUsuario.set(userId, recentes);
    return { ok: true };
  }

  /** Devolve o ultimo uso: um relatorio que falhou inteiro (IA fora do ar) nao conta. */
  estornar(userId: number | string): void {
    const usos = this.porUsuario.get(userId);
    if (usos?.length) usos.pop();
  }
}

/**
 * Limita quantos relatorios cada usuario gera por hora.
 *
 * Cada relatorio faz ate 6 chamadas ao Gemini (uma por secao). O limite global do
 * ThrottlerGuard e por IP e vale 100 req/min, o que nao protege o custo da chave do
 * sistema. Este guard roda depois do JwtAuthGuard e conta por usuario.
 * Configuravel por REPORTS_PER_HOUR.
 */
@Injectable()
export class ReportRateLimitGuard implements CanActivate {
  constructor(private readonly quota: ReportQuotaService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (userId == null) return true; // sem usuario, o JwtAuthGuard ja barrou

    const r = this.quota.consumir(userId);
    if (!r.ok) {
      throw new HttpException(
        `Limite de ${this.quota.limite} relatórios por hora atingido. Tente novamente em ${r.liberaEmMin} min.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
