import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';
import { AuthService } from '@core/auth/auth.service';

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard General',
  materiales: 'Gestión de Materiales',
  'alertas-stock': 'Alertas de Stock Mínimo',
  flota: 'Flota y Maquinaria Pesada',
  clientes: 'Directorio de Clientes',
  ventas: 'Registro de Ventas',
  alquileres: 'Contratos y Alquileres de Flota',
  excel: 'Operaciones Masivas en Hoja de Cálculo',
  sistema: 'Configuración y Diagnóstico del Sistema'
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopbarComponent],
  template: `
    <div class="flex-1 flex flex-col md:flex-row min-h-screen bg-surface">
      <!-- 1. LEFT SIDEBAR -->
      <app-admin-sidebar [period]="'Octubre 2026'" />

      <!-- 2. MAIN CONTENT AREA -->
      <div class="flex-1 flex flex-col overflow-x-hidden min-w-0 bg-surface">
        <app-admin-topbar
          [url]="currentUrl()"
          [title]="currentTitle()"
          [email]="auth.email()"
          [role]="auth.role()"
          (logout)="auth.logout('/admin/login')"
        />

        <main class="flex-1 p-4 md:p-8 max-w-[1280px] w-full mx-auto">
          <router-outlet />
        </main>

        <footer class="mt-auto bg-white border-t-institutional py-6 px-4 md:px-8">
          <div class="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-label-sm text-secondary-label">
            <div class="flex items-center gap-2">
              <span class="font-bold text-carbon">© 2026 FIRMEZA S.A.S.</span>
              <span>•</span>
              <span>Sistema Central de Operaciones y Flota</span>
            </div>
            <div>
              <span>Octubre 2026 • República de Colombia</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUrl = signal<string>(this.router.url);

  readonly currentTitle = computed(() => {
    const url = this.currentUrl();
    for (const [key, title] of Object.entries(TITLES)) {
      if (url.includes(key)) return title;
    }
    return 'Dashboard General';
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
      });
  }
}
