import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportRateLimitGuard, RELATORIOS_POR_HORA_PADRAO } from './report-rate-limit.guard';

const ctx = (userId?: number) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user: userId == null ? undefined : { userId } }) }) }) as any;
const config = (env: Record<string, string>) => ({ get: (k: string) => env[k] }) as unknown as ConfigService;

describe('ReportRateLimitGuard', () => {
  afterEach(() => jest.useRealTimers());

  it('libera ate o limite por hora e bloqueia o seguinte com 429', () => {
    const guard = new ReportRateLimitGuard(config({ REPORTS_PER_HOUR: '3' }));
    expect(guard.canActivate(ctx(1))).toBe(true);
    expect(guard.canActivate(ctx(1))).toBe(true);
    expect(guard.canActivate(ctx(1))).toBe(true);
    try {
      guard.canActivate(ctx(1));
      fail('deveria bloquear');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect((e as HttpException).message).toContain('Limite de 3 relatórios por hora');
    }
  });

  it('conta separado por usuario', () => {
    const guard = new ReportRateLimitGuard(config({ REPORTS_PER_HOUR: '1' }));
    expect(guard.canActivate(ctx(1))).toBe(true);
    expect(guard.canActivate(ctx(2))).toBe(true);
    expect(() => guard.canActivate(ctx(1))).toThrow(HttpException);
  });

  it('libera de novo depois de uma hora', () => {
    jest.useFakeTimers();
    const guard = new ReportRateLimitGuard(config({ REPORTS_PER_HOUR: '1' }));
    expect(guard.canActivate(ctx(1))).toBe(true);
    expect(() => guard.canActivate(ctx(1))).toThrow(HttpException);
    jest.advanceTimersByTime(60 * 60 * 1000 + 1);
    expect(guard.canActivate(ctx(1))).toBe(true);
  });

  it('usa o padrao quando REPORTS_PER_HOUR nao esta definido', () => {
    const guard = new ReportRateLimitGuard(config({}));
    for (let i = 0; i < RELATORIOS_POR_HORA_PADRAO; i++) expect(guard.canActivate(ctx(9))).toBe(true);
    expect(() => guard.canActivate(ctx(9))).toThrow(HttpException);
  });
});
