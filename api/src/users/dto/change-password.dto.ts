import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  senhaAtual: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  novaSenha: string;
}