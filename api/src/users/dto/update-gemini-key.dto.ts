import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGeminiKeyDto {
  // Vazio/ausente limpa a chave.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  geminiApiKey?: string;
}
