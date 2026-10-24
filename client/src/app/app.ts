import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  // A propriedade 'title' é uma string, não uma função.
  title = 'DevComply';

  // Instancia o ThemeService no boot: aplica o tema em todas as telas e acompanha
  // a troca de tema do sistema quando a preferencia e "Automatico".
  private readonly theme = inject(ThemeService);
}
