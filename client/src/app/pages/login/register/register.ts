import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

function passwordMatch(c: AbstractControl): ValidationErrors | null {
  const p = c.get('senha')?.value;
  const cp = c.get('confirmSenha')?.value;
  return p && cp && p !== cp ? { passwordMismatch: true } : null;
}

function mustBeTrue(c: AbstractControl): ValidationErrors | null {
  return c.value === true ? null : { required: true };
}

type Doc = 'politica' | 'termos';

interface ResumoDoc {
  titulo: string;
  url: string;
  pontos: Array<{ titulo: string; texto: string }>;
}

/**
 * Resumos exibidos no cadastro. Precisam acompanhar o texto completo
 * (pages/politica-privacidade e pages/termos-uso): ao mudar um documento,
 * revise o resumo correspondente.
 */
const RESUMOS: Record<Doc, ResumoDoc> = {
  politica: {
    titulo: 'Política de Privacidade',
    url: '/politica-privacidade',
    pontos: [
      {
        titulo: 'O que guardamos',
        texto: 'Nome, e-mail, perfil, senha (só como hash, nunca em texto), seus projetos e as respostas do checklist.',
      },
      {
        titulo: 'Para que usamos',
        texto: 'Criar sua conta, guardar seus projetos e gerar os relatórios de conformidade.',
      },
      {
        titulo: 'Com quem compartilhamos',
        texto: 'Ao gerar um relatório, as respostas dos itens marcados são enviadas ao Google Gemini (IA) para análise, inclusive para servidores fora do Brasil. Não vendemos seus dados.',
      },
      {
        titulo: 'Seus direitos',
        texto: 'Corrigir seus dados e baixar uma cópia deles no Perfil, e excluir a conta quando quiser. A exclusão é imediata e definitiva.',
      },
      {
        titulo: 'Contato',
        texto: 'Encarregado de dados (DPO): artcs2003@gmail.com.',
      },
    ],
  },
  termos: {
    titulo: 'Termos de Uso',
    url: '/termos-uso',
    pontos: [
      {
        titulo: 'O que é o DevComply',
        texto: 'Uma ferramenta de apoio técnico para avaliar a conformidade de projetos com a LGPD, com checklist e relatórios gerados por IA (Google Gemini).',
      },
      {
        titulo: 'O que ele não substitui',
        texto: 'Consultoria jurídica, o encarregado de dados (DPO) ou auditorias formais. As análises são informativas e a responsabilidade pela conformidade continua sendo sua.',
      },
      {
        titulo: 'Sua conta',
        texto: 'É preciso ter 18 anos ou mais e informar dados verdadeiros. A conta é pessoal e intransferível, e você responde pelo que for feito com ela.',
      },
      {
        titulo: 'Uso aceitável',
        texto: 'Não usar o serviço para fins ilícitos, não tentar invadi-lo ou sobrecarregá-lo e não extrair dados por meios automatizados.',
      },
      {
        titulo: 'O que você insere',
        texto: 'Você responde pela veracidade das informações e deve ter autorização para compartilhar os dados técnicos dos seus projetos.',
      },
      {
        titulo: 'Encerramento',
        texto: 'Você pode excluir a conta a qualquer momento, no Perfil ou em Configurações.',
      },
    ],
  },
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register implements OnInit, OnDestroy {
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Resumo da Politica/dos Termos (modal). Substitui os popups de hover, que
  // nao funcionavam no celular nem no teclado e cobriam a outra caixa.
  readonly docs = RESUMOS;
  docAberto: Doc | null = null;
  private focoAnterior: HTMLElement | null = null;

  @ViewChild('docModal') private docModal?: ElementRef<HTMLElement>;


  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        nome: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        perfil: ['desenvolvedor', [Validators.required]],
        senha: ['', [Validators.required, Validators.minLength(8)]],
        confirmSenha: ['', [Validators.required]],
        aceitaPolitica: [false, [mustBeTrue]],
        aceitaTermos: [false, [mustBeTrue]],
        declaraMaioridade: [false, [mustBeTrue]]
      },
      { validators: passwordMatch }
    );
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nome, email, senha, perfil, aceitaPolitica, aceitaTermos, declaraMaioridade } =
      this.form.value;
    this.loading = true;

    // O aceite agora vai junto: antes o formulario exigia as duas caixas e descartava
    // o resultado aqui, o que travava o botao sem registrar consentimento nenhum.
    this.auth.register(
      {
        nome: nome!.trim(),
        email: email!.trim(),
        senha: senha!,
        perfil: perfil!,
        aceitaPolitica: !!aceitaPolitica,
        aceitaTermos: !!aceitaTermos,
        declaraMaioridade: !!declaraMaioridade
      },
      { autoLogin: false }
    ).subscribe({
      next: () => {
        this.successMessage = 'Conta criada com sucesso! Você já pode entrar.';
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Não foi possível criar sua conta.';
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }
  abrirDoc(doc: Doc, event?: Event): void {
    event?.preventDefault();
    this.focoAnterior = document.activeElement as HTMLElement | null;
    this.docAberto = doc;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.docModal?.nativeElement.focus());
  }

  fecharDoc(): void {
    if (!this.docAberto) return;
    this.docAberto = null;
    document.body.style.overflow = '';
    this.focoAnterior?.focus();
  }

  /** "Li e concordo" no resumo marca a caixa correspondente. */
  aceitarDoc(): void {
    const campo = this.docAberto === 'politica' ? 'aceitaPolitica' : 'aceitaTermos';
    this.form.get(campo)?.setValue(true);
    this.form.get(campo)?.markAsTouched();
    this.fecharDoc();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.fecharDoc();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}