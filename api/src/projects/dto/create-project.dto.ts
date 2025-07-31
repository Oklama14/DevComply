import { IsString, IsNotEmpty, MinLength } from 'class-validator';

// Esta classe define a estrutura de dados esperada no corpo (body)
// de uma requisição para criar um novo projeto.
export class CreateProjectDto {
  // O decorador @IsNotEmpty() garante que o campo não pode ser vazio.
  // O decorador @IsString() garante que o valor seja uma string.
  // O decorador @MinLength(3) garante que o nome tenha no mínimo 3 caracteres.
  @IsNotEmpty({ message: 'O nome do projeto não pode ser vazio.' })
  @IsString()
  @MinLength(3)
  nome: string;

  @IsNotEmpty({ message: 'A descrição não pode ser vazia.' })
  @IsString()
  descricao: string;
}
