import { Component, computed, inject, input, output } from '@angular/core';
import { AdminStateService } from '@core/services/admin-state.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  template: `
    <header class="h-16 bg-white border-b-institutional px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <!-- Mobile Drawer Hamburger Toggle Button -->
        <button
          type="button"
          (click)="adminState.toggleMobile()"
          class="md:hidden p-2 rounded-lg text-carbon hover:bg-warm-surface institutional-border flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          aria-label="Abrir menú de navegación móvil"
        >
          <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <span class="font-headline-sm text-headline-sm text-carbon font-semibold truncate max-w-[220px] sm:max-w-none">
          {{ title() }}
        </span>
        <span class="hidden sm:inline-block h-4 w-[1px] bg-[#DEDCD8]"></span>
        <span class="hidden sm:inline-flex items-center gap-1.5 font-label-sm text-label-sm text-[#1E7B3A]">
          <span class="w-2 h-2 rounded-full bg-[#1E7B3A]"></span>
          <span>Sistema Conectado</span>
        </span>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-warm-surface institutional-border flex items-center justify-center font-semibold text-carbon text-body-sm">
            {{ initials() }}
          </div>
          <div class="hidden md:flex flex-col text-left">
            <span class="font-label-md text-label-md font-semibold text-carbon leading-tight">
              [{{ email() || 'admin@firmeza.com' }}]
            </span>
            <span class="font-label-sm text-label-sm text-secondary-label">
              {{ roleDisplay() }}
            </span>
          </div>
        </div>

        <div class="h-6 w-[1px] bg-[#DEDCD8]"></div>

        <button
          type="button"
          class="h-9 px-3 institutional-border rounded-xl font-body-sm text-body-sm text-carbon hover:bg-warm-surface flex items-center gap-1.5 transition-colors"
          (click)="logout.emit()"
          title="Cerrar sesión actual"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span class="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  `
})
export class AdminTopbarComponent {
  readonly adminState = inject(AdminStateService);

  readonly url = input<string>('');
  readonly title = input.required<string>();
  readonly email = input<string | null | undefined>(null);
  readonly role = input<string | string[] | null | undefined>(null);

  readonly logout = output<void>();

  readonly initials = computed(() => {
    const em = this.email();
    if (!em) return 'AD';
    const first = em.charAt(0).toUpperCase();
    return first + 'D';
  });

  readonly roleDisplay = computed(() => {
    const r = this.role();
    if (!r) return 'Administrador Central';
    if (Array.isArray(r)) return r.join(', ');
    return String(r);
  });
}
