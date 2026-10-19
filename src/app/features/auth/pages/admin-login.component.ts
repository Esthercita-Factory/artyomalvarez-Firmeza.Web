import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertComponent } from '@components/alert.component';
import { AuthService } from '@services/auth.service';
import { errMsg } from '@utils/util';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, AlertComponent],
  template: `
    <div class="fixed inset-0 z-50 bg-[#2C2A29] flex items-center justify-center p-4">
      <div class="w-full max-w-[460px] bg-white institutional-border rounded-xl p-8 flex flex-col gap-6 shadow-sm">
        <!-- Brand & Header -->
        <div class="flex flex-col items-center text-center gap-2">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 bg-primary-container text-carbon font-extrabold flex items-center justify-center text-headline-sm rounded">
              F
            </span>
            <span class="font-headline-md text-headline-md tracking-wider font-bold text-carbon">
              FIRMEZA
            </span>
            <span class="text-secondary-label font-light">|</span>
            <span class="text-carbon font-semibold text-body-sm">
              Acceso Administrativo
            </span>
          </div>
          <p class="font-body-sm text-body-sm text-secondary-label mt-1">
            Sistema de control operativo y logístico.
          </p>
        </div>

        <app-alert [text]="errorMessage()" />

        <!-- Login Form -->
        <form class="flex flex-col gap-4" (ngSubmit)="onSubmit()">
          <div class="flex flex-col gap-1.5">
            <label for="admin-email" class="font-label-sm text-label-sm text-carbon font-medium">
              Correo institucional *
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              [(ngModel)]="email"
              placeholder="admin@firmeza.com"
              class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="admin-pass" class="font-label-sm text-label-sm text-carbon font-medium">
              Contraseña de acceso *
            </label>
            <div class="relative">
              <input
                id="admin-pass"
                name="password"
                [type]="showPassword() ? 'text' : 'password'"
                required
                [(ngModel)]="password"
                placeholder="••••••••"
                class="w-full h-10 pl-3 pr-10 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
              />
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute right-3 top-2.5 text-secondary-label hover:text-carbon"
                aria-label="Alternar visibilidad de contraseña"
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
            class="h-11 btn-primary-yellow font-semibold mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            @if (loading()) {
              <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
              <span>Verificando perfil administrativo...</span>
            } @else {
              <span>Ingresar al Sistema Central</span>
              <span class="material-symbols-outlined text-[18px]">login</span>
            }
          </button>
        </form>

        <div class="border-t-institutional pt-4 text-center flex flex-col gap-2">
          <p class="font-label-sm text-label-sm text-secondary-label">
            Acceso estrictamente restringido a colaboradores autorizados de FIRMEZA S.A.S.
          </p>
        </div>
      </div>
    </div>
  `
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = 'admin@firmeza.com';
  password = '';
  readonly showPassword = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Ingrese su correo y contraseña institucional.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        // Verificar rol Administrador
        if (!this.auth.isAdmin()) {
          this.auth.clear();
          this.loading.set(false);
          this.errorMessage.set('Acceso denegado: Esta cuenta no cuenta con permisos administrativos.');
          return;
        }

        this.loading.set(false);
        this.router.navigateByUrl('/admin/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(errMsg(err));
      }
    });
  }
}
