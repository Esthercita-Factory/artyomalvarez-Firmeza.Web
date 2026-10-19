import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertComponent } from '@components/alert.component';
import { AuthService } from '@services/auth.service';
import { errMsg } from '@utils/util';

@Component({
  selector: 'app-login',
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
          <p class="font-body-sm text-body-sm text-secondary-label">
            Portal Corporativo B2B — Ingreso de Clientes y Contratistas
          </p>
        </div>

        <app-alert [text]="errorMessage()" />

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
                [(ngModel)]="password"
                placeholder="••••••••"
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

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full h-11 btn-primary-yellow font-semibold mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            @if (loading()) {
              <div class="w-5 h-5 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
              <span>Validando credenciales...</span>
            } @else {
              <span>Ingresar al Portal</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            }
          </button>
        </form>

        <div class="border-t border-[#DEDCD8] pt-4 flex flex-col gap-2.5 text-center text-label-sm text-secondary-label">
          <p>
            ¿No tienes cuenta de cliente?
            <a routerLink="/register" class="text-carbon font-semibold underline hover:text-primary-container">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly showPassword = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Por favor ingrese su correo y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/materiales');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(errMsg(err));
      }
    });
  }
}
