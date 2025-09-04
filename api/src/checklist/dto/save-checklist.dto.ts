import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  checked: boolean;

  @IsString()
  implementationDetails: string;

  @IsString()
  technicalDetails: string;
}

export class SaveChecklistDto {
  @IsArray()
  items: ChecklistItemDto[];
}
