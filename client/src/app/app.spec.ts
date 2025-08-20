import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app'; // Corrigido para importar AppComponent
import { RouterTestingModule } from '@angular/router/testing';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // AppComponent é standalone, então o importamos diretamente.
      // RouterTestingModule é necessário porque o template usa <router-outlet>.
      imports: [AppComponent, RouterTestingModule],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'DevComply' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    // Verificamos a propriedade 'title' diretamente no componente.
    expect(app.title).toEqual('DevComply');
  });
});
