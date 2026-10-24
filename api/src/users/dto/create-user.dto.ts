import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  perfil: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  senha: string;

  // O ValidationPipe global roda com forbidNonWhitelisted, entao estes dois campos
  // precisam existir aqui para o aceite chegar ao backend. Equals(true) recusa o
  // cadastro sem aceite em vez de aceitar silenciosamente um false.
  @IsBoolean()
  @Equals(true, { message: 'É necessário aceitar a Política de Privacidade.' })
  aceitaPolitica: boolean;

  @IsBoolean()
  @Equals(true, { message: 'É necessário aceitar os Termos de Uso.' })
  aceitaTermos: boolean;

  // Os Termos (4.1) exigem 18 anos ou mais. A declaracao vem junto com o aceite:
  // o cadastro so passa com true, entao termosAceitoEm marca tambem o momento dela.
  @IsBoolean()
  @Equals(true, { message: 'É necessário declarar ter 18 anos ou mais.' })
  declaraMaioridade: boolean;
}