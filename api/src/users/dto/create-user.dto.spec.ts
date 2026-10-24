import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { ChangePasswordDto } from './change-password.dto';

const valido = {
  nome: 'Pessoa',
  email: 'p@example.com',
  perfil: 'desenvolvedor',
  senha: '12345678',
  aceitaPolitica: true,
  aceitaTermos: true,
  declaraMaioridade: true,
};

const erros = (cls: any, obj: object) =>
  validateSync(plainToInstance(cls, obj)).map((e) => e.property);

describe('CreateUserDto', () => {
  it('aceita um cadastro completo', () => {
    expect(erros(CreateUserDto, valido)).toEqual([]);
  });

  it('exige senha de no minimo 8 caracteres', () => {
    expect(erros(CreateUserDto, { ...valido, senha: '1234567' })).toEqual(['senha']);
  });

  it('exige a declaracao de 18 anos ou mais', () => {
    expect(erros(CreateUserDto, { ...valido, declaraMaioridade: false })).toEqual(['declaraMaioridade']);
    const { declaraMaioridade, ...semDeclaracao } = valido;
    expect(erros(CreateUserDto, semDeclaracao)).toEqual(['declaraMaioridade']);
  });
});

describe('ChangePasswordDto', () => {
  it('exige nova senha de no minimo 8 caracteres', () => {
    expect(erros(ChangePasswordDto, { senhaAtual: 'x', novaSenha: '1234567' })).toEqual(['novaSenha']);
    expect(erros(ChangePasswordDto, { senhaAtual: 'x', novaSenha: '12345678' })).toEqual([]);
  });
});
