import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class SaveChecklistDto {
  @IsInt()
  perguntaId: number;

  @IsOptional()
  @IsString()
  resposta?: string;

  @IsOptional()
  @IsString()
  detalhesTecnicos?: string;

  @IsBoolean()
  conformidade: boolean;
}
