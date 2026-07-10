import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  it('faz round-trip encrypt/decrypt quando ha chave', () => {
    const svc = new EncryptionService({ get: () => 'segredo-de-teste' } as unknown as ConfigService);
    const enc = svc.encrypt('minha-chave-gemini');
    expect(enc.startsWith('enc:v1:')).toBe(true);
    expect(enc).not.toContain('minha-chave-gemini');
    expect(svc.decrypt(enc)).toBe('minha-chave-gemini');
  });

  it('sem chave, guarda em texto (compat legado)', () => {
    const svc = new EncryptionService({ get: () => undefined } as unknown as ConfigService);
    expect(svc.encrypt('abc')).toBe('abc');
    expect(svc.decrypt('abc')).toBe('abc');
  });
});
