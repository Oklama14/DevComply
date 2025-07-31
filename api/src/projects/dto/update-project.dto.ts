import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

// A classe UpdateProjectDto herda todas as propriedades e validações
// da classe CreateProjectDto, mas o PartialType as torna todas opcionais.
// Isso significa que o front-end pode enviar apenas o 'nome' ou apenas a 'descricao'
// para serem atualizados, sem que a validação falhe.
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
