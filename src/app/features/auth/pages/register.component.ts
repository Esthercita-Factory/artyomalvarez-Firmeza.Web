import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertComponent } from '@components/alert.component';
import { AuthService } from '@services/auth.service';
import { errMsg } from '@utils/util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, AlertComponent],
  template: `
    <div class="py-12 px-4 max-w-[460px] mx-auto flex flex-col gap-6">
      <div class="bg-white border border-[#DEDCD8] rounded-xl p-8 flex flex-col gap-6 shadow-sm">
        <!-- Brand Header -->
        <div class="flex flex-col items-center text-center gap-2">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 bg-primary-container text-carbon font-extrabold flex items-center justify-center text-headline-sm rounded">
              F
            </span>
            <span class="font-headline-md text-headline-md tracking-wider font-bold text-carbon">
              FIRMEZA
            </span>
          </div>
          <h2 class="font-headline-sm text-headline-sm font-bold text-carbon">
            Registro de Cliente
          </h2>
          <p class="font-body-sm text-body-sm text-secondary-label">
            Crea tu cuenta corporativa para comprar materiales y cotizar alquiler de flota.
          </p>
        </div>

        <app-alert [text]="errorMessage()" />

        @if (successMessage()) {
          <div class="p-6 rounded-xl institutional-border bg-[#E8F5E9] text-[#1E7B3A] border-[#A5D6A7] flex flex-col items-center justify-center text-center gap-3">
            <span class="material-symbols-outlined text-[48px]">check_circle</span>
            <h3 class="font-headline-sm text-headline-sm font-bold">¡Cuenta Creada Exitosamente!</h3>
            <p class="font-body-sm text-body-sm">
              {{ successMessage() }}
            </p>
            <a
              routerLink="/login"
              class="mt-2 w-full h-11 btn-primary-yellow font-semibold flex items-center justify-center gap-2"
            >
              <span>Iniciar Sesión Ahora</span>
              <span class="material-symbols-outlined text-[18px]">login</span>
            </a>
          </div>
        } @else {
          <form class="flex flex-col gap-4" (ngSubmit)="onSubmit()">
            <div class="flex flex-col gap-1.5">
              <label for="email" class="font-label-sm text-label-sm text-carbon font-medium">
                Correo Electrónico *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                [(ngModel)]="email"
                placeholder="cliente@empresa.com"
                class="h-11 px-3 bg-white institutional-border rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="password" class="font-label-sm text-label-sm text-carbon font-medium">
                Contraseña *
              </label>
              <div class="relative">
                <input
                  id="password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  required
                  minlength="6"
                  [(ngModel)]="password"
                  placeholder="Mínimo 6 caracteres con mayúscula y número"
                  class="w-full h-11 pl-3 pr-10 bg-white institutional-border rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-3 text-secondary-label hover:text-carbon"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  <span class="material-symbols-outlined text-[20px]">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="confirmPassword" class="font-label-sm text-label-sm text-carbon font-medium">
                Confirmar Contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                [type]="showPassword() ? 'text' : 'password'"
                required
                [(ngModel)]="confirmPassword"
                placeholder="Repite tu contraseña"
                class="h-11 px-3 bg-white institutional-border rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full h-11 btn-primary-yellow font-semibold mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              @if (loading()) {
                <div class="w-5 h-5 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                <span>Creando cuenta...</span>
              } @else {
                <span>Crear Cuenta Corporativa</span>
                <span class="material-symbols-outlined text-[18px]">person_add</span>
              }
            </button>
          </form>
        }

        <div class="border-t border-[#DEDCD8] pt-4 flex flex-col gap-2.5 text-center text-label-sm text-secondary-label">
          <p>
            ¿Ya tienes una cuenta registrada?
            <a routerLink="/login" class="text-carbon font-semibold underline hover:text-primary-container">
              Iniciar Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  readonly showPassword = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password || !this.confirmPassword) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage.set('El formato del correo electrónico no es válido.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.register(this.email.trim(), this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(
          res.message || 'Tu registro ha sido completado exitosamente. Se ha enviado un correo de bienvenida.'
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(errMsg(err));
      }
    });
  }
}
