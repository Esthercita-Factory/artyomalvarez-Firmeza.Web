import { inject, Injectable, signal } from '@angular/core';
import { DashboardMetrics } from '@models/models';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminStateService {
  private readonly api = inject(ApiService);

  readonly sidebarCollapsed = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('firmeza_sidebar_collapsed') === 'true'
  );

  readonly sidebarMobileOpen = signal<boolean>(false);

  // Set of menu item IDs whose submenu is expanded
  readonly expandedSubmenus = signal<Set<string>>(new Set(['catalogo', 'comercial']));

  readonly metrics = signal<DashboardMetrics | null>(null);

  constructor() {
    this.refreshMetrics();
  }

  toggleCollapse(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('firmeza_sidebar_collapsed', String(next));
    }
  }

  setMobileOpen(open: boolean): void {
    this.sidebarMobileOpen.set(open);
  }

  toggleMobile(): void {
    this.sidebarMobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.sidebarMobileOpen.set(false);
  }

  toggleSubmenu(id: string): void {
    this.expandedSubmenus.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isSubmenuOpen(id: string): boolean {
    return this.expandedSubmenus().has(id);
  }

  refreshMetrics(): void {
    this.api.getMetrics().subscribe({
      next: (m) => {
        if (m) {
          this.metrics.set(m);
        }
      },
      error: () => {
        // Fallback or retry silently
      }
    });
  }
}
