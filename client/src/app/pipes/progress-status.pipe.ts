// src/projects/pipes/progress-status.pipe.ts
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'progressStatus',
})

export class ProgressStatusPipe implements PipeTransform {
  transform(value: number): string {
    if (value >= 100) return 'Completado';
    if (value > 0) return 'Em progresso';
    return 'Pendente';
  }
}
