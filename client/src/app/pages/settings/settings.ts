import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

interface SettingsData {
  openaiApiKey: string;
  enableAiSuggestions: boolean;
  autoSaveResponses: boolean;
  detailedReports: boolean;
  enableNotifications: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class Settings implements OnInit {
  settingsForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  private initializeForm(): void {
    this.settingsForm = this.fb.group({
      openaiApiKey: [''],
      enableAiSuggestions: [true],
      autoSaveResponses: [true],
      detailedReports: [true],
      enableNotifications: [true]
    });
  }

  private loadSettings(): void {
    // Carregar configurações salvas do localStorage ou serviço
    const savedSettings = localStorage.getItem('devcomply-settings');
    if (savedSettings) {
      const settings: SettingsData = JSON.parse(savedSettings);
      this.settingsForm.patchValue(settings);
    }
  }

  onSaveSettings(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const settings: SettingsData = this.settingsForm.value;
      
      // Salvar no localStorage (em uma aplicação real, enviaria para o backend)
      localStorage.setItem('devcomply-settings', JSON.stringify(settings));
      
      this.successMessage = 'Configurações salvas com sucesso!';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      this.errorMessage = 'Erro ao salvar configurações. Tente novamente.';
      console.error('Erro ao salvar configurações:', error);
    } finally {
      this.loading = false;
    }
  }

  onResetSettings(): void {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      this.settingsForm.reset({
        openaiApiKey: '',
        enableAiSuggestions: true,
        autoSaveResponses: true,
        detailedReports: true,
        enableNotifications: true
      });
      
      // Remove do localStorage
      localStorage.removeItem('devcomply-settings');
      
      this.successMessage = 'Configurações restauradas para o padrão.';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }
  }

  // Getter para facilitar acesso aos controles do formulário
  get f() { return this.settingsForm.controls; }
}