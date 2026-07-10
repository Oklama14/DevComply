import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';

/**
 * Cifra/decifra segredos em repouso (AES-256-GCM).
 * A chave vem de APP_ENCRYPTION_KEY. Se ausente, os valores sao guardados em
 * texto (com aviso) e o decrypt continua funcionando para dados legados.
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer | null;
  private static readonly PREFIX = 'enc:v1:';

  constructor(config: ConfigService) {
    const secret = config.get<string>('APP_ENCRYPTION_KEY');
    this.key = secret ? createHash('sha256').update(secret).digest() : null;
    if (!this.key) {
      this.logger.warn(
        'APP_ENCRYPTION_KEY nao definida — segredos (ex.: chave Gemini) serao guardados sem cifra.',
      );
    }
  }

  encrypt(plain: string): string {
    if (!this.key) return plain;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${EncryptionService.PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
  }

  decrypt(value: string): string {
    if (!value?.startsWith(EncryptionService.PREFIX)) return value; // texto puro (legado)
    if (!this.key) {
      this.logger.error(
        'Valor cifrado encontrado mas APP_ENCRYPTION_KEY esta ausente.',
      );
      return '';
    }
    const [ivB64, tagB64, ctB64] = value
      .slice(EncryptionService.PREFIX.length)
      .split(':');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}
