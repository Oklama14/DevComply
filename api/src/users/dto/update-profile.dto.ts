import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsEmail()  email?: string; // se permitir troca de e-mail
  @IsOptional() @IsString() perfil?: string; // ex.: 'desenvolvedor'
}