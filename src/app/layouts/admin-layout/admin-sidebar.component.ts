import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminStateService } from '@core/services/admin-state.service';
import { StockAlertsService } from '@core/services/stock-alerts.service';

export interface NavChildItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  exact?: boolean;
  badge?: () => number | string | null;
  badgeVariant?: 'warning' | 'info' | 'success';
  children?: NavChildItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Drawer Backdrop Overlay -->
    @if (adminState.sidebarMobileOpen()) {
      <div
        class="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
        (click)="adminState.closeMobile()"
        aria-hidden="true"
      ></div>
    }

    <!-- Responsive Sidebar Aside -->
    <aside
      class="fixed inset-y-0 left-0 z-50 md:sticky md:top-0 h-screen bg-[#1F1E1D] text-white flex-shrink-0 flex flex-col justify-between border-r border-[#3E3C3A] transition-all duration-300 ease-in-out md:translate-x-0 shadow-2xl md:shadow-none"
      [class.translate-x-0]="adminState.sidebarMobileOpen()"
      [class.-translate-x-full]="!adminState.sidebarMobileOpen()"
      [class.w-72]="true"
      [class.md:w-64]="!adminState.sidebarCollapsed()"
      [class.md:w-20]="adminState.sidebarCollapsed()"
    >
      <!-- Top Section: Header & Navigation -->
      <div class="flex flex-col flex-1 min-h-0">
        <!-- Brand Header in Sidebar -->
        <div class="h-16 px-4 md:px-5 flex items-center justify-between border-b border-[#3E3C3A] flex-shrink-0">
          <div class="flex items-center gap-3 overflow-hidden">
            <span class="w-8 h-8 min-w-[32px] bg-primary-container text-carbon font-extrabold flex items-center justify-center text-[15px] rounded shadow-sm">
              F
            </span>

            @if (!adminState.sidebarCollapsed()) {
              <div class="flex flex-col truncate">
                <span class="font-headline-sm text-[13px] tracking-wider font-bold text-white uppercase leading-tight truncate">
                  FIRMEZA
                </span>
                <span class="text-[10px] text-primary-container uppercase tracking-wider font-semibold truncate">
                  Panel Administrativo
                </span>
              </div>
            }
          </div>

          <!-- Header Controls -->
          <div class="flex items-center gap-1">
            <!-- Desktop Collapse/Expand Toggle Button -->
            <button
              type="button"
              (click)="adminState.toggleCollapse()"
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-[#BDBAB7] hover:text-white hover:bg-[#383533] transition-colors focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:outline-none"
              [title]="adminState.sidebarCollapsed() ? 'Expandir barra lateral' : 'Colapsar barra lateral'"
              [attr.aria-label]="adminState.sidebarCollapsed() ? 'Expandir barra lateral' : 'Colapsar barra lateral'"
            >
              <span class="material-symbols-outlined text-[20px]">
                {{ adminState.sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}
              </span>
            </button>

            <!-- Mobile Close Button -->
            <button
              type="button"
              (click)="adminState.closeMobile()"
              class="flex md:hidden w-8 h-8 rounded-lg items-center justify-center text-[#BDBAB7] hover:text-white hover:bg-[#383533] transition-colors"
              aria-label="Cerrar menú móvil"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <!-- Navigation Menu Container -->
        <nav
          aria-label="Menú principal de administración"
          class="flex-1 overflow-y-auto px-2.5 py-4 flex flex-col gap-4 select-none scrollbar-thin"
        >
          @for (sec of navSections(); track sec.title) {
            <div class="flex flex-col gap-1">
              <!-- Section Title (Expanded vs Collapsed) -->
              @if (!adminState.sidebarCollapsed()) {
                <div class="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8885]">
                  {{ sec.title }}
                </div>
              } @else {
                <div class="h-[1px] bg-[#3E3C3A] my-1 mx-2" title="{{ sec.title }}"></div>
              }

              <!-- Section Navigation Items -->
              @for (item of sec.items; track item.id) {
                <!-- CASE A: Item without submenus -->
                @if (!item.children || item.children.length === 0) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="tab-active"
                    [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                    (click)="onLinkClick()"
                    class="nav-admin tab-inactive relative group"
                    [class.justify-center]="adminState.sidebarCollapsed()"
                    [title]="adminState.sidebarCollapsed() ? item.label : ''"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="material-symbols-outlined text-[20px] flex-shrink-0">
                        {{ item.icon }}
                      </span>
                      @if (!adminState.sidebarCollapsed()) {
                        <span class="truncate">{{ item.label }}</span>
                      }
                    </div>

                    <!-- Badge Count (when expanded) -->
                    @if (!adminState.sidebarCollapsed() && item.badge && item.badge() !== null) {
                      <span
                        class="px-2 py-0.5 rounded text-[11px] font-bold font-mono"
                        [class.bg-[#FFF8E1]]="item.badgeVariant === 'warning'"
                        [class.text-[#B45F06]]="item.badgeVariant === 'warning'"
                        [class.border]="true"
                        [class.border-[#FFE082]]="item.badgeVariant === 'warning'"
                        [class.bg-[#E3F2FD]]="item.badgeVariant === 'info'"
                        [class.text-[#0B5CAD]]="item.badgeVariant === 'info'"
                        [class.border-[#BBDEFB]]="item.badgeVariant === 'info'"
                        [class.bg-[#383533]]="!item.badgeVariant"
                        [class.text-white]="!item.badgeVariant"
                        [class.border-[#524E4B]]="!item.badgeVariant"
                      >
                        {{ item.badge() }}
                      </span>
                    }

                    <!-- Tooltip for Collapsed Mode (Desktop) -->
                    @if (adminState.sidebarCollapsed()) {
                      <div
                        class="hidden md:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-[#2C2A29] text-white text-body-sm rounded-lg shadow-xl border border-[#524E4B] whitespace-nowrap z-50 items-center gap-2 pointer-events-none"
                      >
                        <span>{{ item.label }}</span>
                        @if (item.badge && item.badge() !== null) {
                          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FDDA24] text-carbon">
                            {{ item.badge() }}
                          </span>
                        }
                      </div>
                    }
                  </a>
                } @else {
                  <!-- CASE B: Item with dropdown submenus -->
                  <div class="flex flex-col relative group">
                    <button
                      type="button"
                      (click)="toggleSubmenu(item.id)"
                      class="nav-admin tab-inactive"
                      [class.justify-center]="adminState.sidebarCollapsed()"
                      [class.bg-[#2C2A29]]="isItemActive(item)"
                      [class.text-white]="isItemActive(item)"
                      [attr.aria-expanded]="adminState.isSubmenuOpen(item.id)"
                      [title]="adminState.sidebarCollapsed() ? item.label : ''"
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <span class="material-symbols-outlined text-[20px] flex-shrink-0">
                          {{ item.icon }}
                        </span>
                        @if (!adminState.sidebarCollapsed()) {
                          <span class="truncate">{{ item.label }}</span>
                        }
                      </div>

                      @if (!adminState.sidebarCollapsed()) {
                        <div class="flex items-center gap-1.5">
                          @if (item.badge && item.badge() !== null) {
                            <span
                              class="px-2 py-0.5 rounded text-[11px] font-bold font-mono"
                              [class.bg-[#FFF8E1]]="item.badgeVariant === 'warning'"
                              [class.text-[#B45F06]]="item.badgeVariant === 'warning'"
                              [class.border]="true"
                              [class.border-[#FFE082]]="item.badgeVariant === 'warning'"
                              [class.bg-[#E3F2FD]]="item.badgeVariant === 'info'"
                              [class.text-[#0B5CAD]]="item.badgeVariant === 'info'"
                              [class.border-[#BBDEFB]]="item.badgeVariant === 'info'"
                              [class.bg-[#383533]]="!item.badgeVariant"
                              [class.text-white]="!item.badgeVariant"
                              [class.border-[#524E4B]]="!item.badgeVariant"
                            >
                              {{ item.badge() }}
                            </span>
                          }

                          <span
                            class="material-symbols-outlined text-[18px] text-[#8C8885] transition-transform duration-200"
                            [class.rotate-180]="adminState.isSubmenuOpen(item.id)"
                          >
                            expand_more
                          </span>
                        </div>
                      }
                    </button>

                    <!-- Expanded Submenu Items -->
                    @if (!adminState.sidebarCollapsed() && adminState.isSubmenuOpen(item.id)) {
                      <div class="pl-8 pr-1 py-1 flex flex-col gap-1 border-l-2 border-[#3E3C3A] ml-5 my-1">
                        @for (child of item.children; track child.id) {
                          <a
                            [routerLink]="child.route"
                            routerLinkActive="text-primary-container font-semibold"
                            [routerLinkActiveOptions]="{ exact: false }"
                            (click)="onLinkClick()"
                            class="py-1.5 px-2 rounded-lg text-body-sm text-[#BDBAB7] hover:text-white hover:bg-[#2C2A29] flex items-center justify-between transition-colors"
                          >
                            <span class="truncate">{{ child.label }}</span>
                            @if (child.icon) {
                              <span class="material-symbols-outlined text-[15px] opacity-70">
                                {{ child.icon }}
                              </span>
                            }
                          </a>
                        }
                      </div>
                    }

                    <!-- Tooltip for Collapsed Mode -->
                    @if (adminState.sidebarCollapsed()) {
                      <div
                        class="hidden md:group-hover:flex absolute left-full ml-3 p-2 bg-[#2C2A29] text-white text-body-sm rounded-lg shadow-xl border border-[#524E4B] flex-col gap-1 whitespace-nowrap z-50"
                      >
                        <div class="font-bold text-white border-b border-[#3E3C3A] pb-1 flex items-center gap-2">
                          <span>{{ item.label }}</span>
                          @if (item.badge && item.badge() !== null) {
                            <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FDDA24] text-carbon">
                              {{ item.badge() }}
                            </span>
                          }
                        </div>
                        @for (child of item.children; track child.id) {
                          <a
                            [routerLink]="child.route"
                            (click)="onLinkClick()"
                            class="py-1 px-2 text-[#BDBAB7] hover:text-white hover:bg-[#383533] rounded"
                          >
                            {{ child.label }}
                          </a>
                        }
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        </nav>
      </div>

      <!-- Bottom Section: Quick Links & Accounting Period -->
      <div class="p-3 border-t border-[#3E3C3A] flex flex-col gap-2 flex-shrink-0 bg-[#1A1918]">
        @if (!adminState.sidebarCollapsed()) {
          <div class="flex flex-col gap-1">
            <a
              routerLink="/materiales"
              (click)="onLinkClick()"
              class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl font-body-sm text-body-sm text-[#BDBAB7] hover:text-white hover:bg-[#383533] transition-colors focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:outline-none"
            >
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">storefront</span>
                <span>Portal Público</span>
              </span>
              <span class="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          <div class="px-3 py-2 bg-[#121211] rounded-xl flex items-center justify-between text-[11px] text-[#A3A09D] border border-[#2E2C2A]">
            <span>Periodo Contable</span>
            <span class="font-semibold text-white">{{ period() }}</span>
          </div>
        } @else {
          <!-- Collapsed Bottom Bar -->
          <div class="flex flex-col items-center gap-2">
            <a
              routerLink="/materiales"
              (click)="onLinkClick()"
              class="p-2 rounded-lg text-[#BDBAB7] hover:text-white hover:bg-[#383533] transition-colors"
              title="Ver Portal Público"
            >
              <span class="material-symbols-outlined text-[20px]">storefront</span>
            </a>

            <div class="text-[10px] font-mono text-[#8C8885] text-center" title="Octubre 2026">
              10/26
            </div>
          </div>
        }
      </div>
    </aside>
  `
})
export class AdminSidebarComponent {
  readonly adminState = inject(AdminStateService);
  readonly stockAlerts = inject(StockAlertsService);
  private readonly router = inject(Router);

  readonly period = input<string>('Octubre 2026');

  readonly navSections = computed<NavSection[]>(() => {
    const metrics = this.adminState.metrics();
    const lowStock = this.stockAlerts.lowStockCount();
    const activeRentals = metrics?.activeRentalsCount ?? null;
    const salesCount = metrics?.totalSalesCount ?? null;

    return [
      {
        title: 'PRINCIPAL',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'dashboard',
            route: '/admin/dashboard',
            exact: true
          }
        ]
      },
      {
        title: 'CATÁLOGO',
        items: [
          {
            id: 'catalogo-mat',
            label: 'Materiales',
            icon: 'category',
            route: '/admin/materiales',
            badge: () => (lowStock > 0 ? `${lowStock} bajo${lowStock > 1 ? 's' : ''}` : null),
            badgeVariant: 'warning',
            children: [
              { id: 'mat-all', label: 'Catálogo de Existencias', route: '/admin/materiales', icon: 'inventory' },
              { id: 'mat-alerts', label: 'Alertas de Stock Mínimo', route: '/admin/alertas-stock', icon: 'warning' }
            ]
          },
          {
            id: 'catalogo-flota',
            label: 'Flota y Maquinaria',
            icon: 'local_shipping',
            route: '/admin/flota',
            children: [
              { id: 'flota-all', label: 'Inventario de Equipos', route: '/admin/flota', icon: 'directions_car' },
              { id: 'flota-alq', label: 'Contratos de Alquiler', route: '/admin/alquileres', icon: 'front_loader' }
            ]
          }
        ]
      },
      {
        title: 'COMERCIAL',
        items: [
          {
            id: 'comercial-ventas',
            label: 'Ventas',
            icon: 'receipt_long',
            route: '/admin/ventas',
            badge: () => (salesCount ? salesCount : null),
            children: [
              { id: 'ven-historial', label: 'Historial de Transacciones', route: '/admin/ventas', icon: 'history' },
              { id: 'ven-nueva', label: 'Punto de Venta / Carrito', route: '/carrito', icon: 'shopping_cart' }
            ]
          },
          {
            id: 'comercial-alquileres',
            label: 'Alquileres',
            icon: 'front_loader',
            route: '/admin/alquileres',
            badge: () => (activeRentals && activeRentals > 0 ? `${activeRentals} act.` : null),
            badgeVariant: 'info',
            children: [
              { id: 'alq-contratos', label: 'Contratos y Operaciones', route: '/admin/alquileres', icon: 'format_list_bulleted' },
              { id: 'alq-cotizar', label: 'Nueva Cotización', route: '/cotizaciones', icon: 'calculate' }
            ]
          },
          {
            id: 'comercial-clientes',
            label: 'Clientes',
            icon: 'group',
            route: '/admin/clientes'
          }
        ]
      },
      {
        title: 'DATOS',
        items: [
          {
            id: 'datos-excel',
            label: 'Operaciones Excel',
            icon: 'table_chart',
            route: '/admin/excel',
            children: [
              { id: 'exc-import', label: 'Importación Masiva', route: '/admin/excel', icon: 'upload_file' },
              { id: 'exc-export', label: 'Plantillas y Respaldos', route: '/admin/excel', icon: 'download' }
            ]
          }
        ]
      },
      {
        title: 'SISTEMA',
        items: [
          {
            id: 'sistema-config',
            label: 'Configuración y Diagnóstico',
            icon: 'settings',
            route: '/admin/sistema'
          }
        ]
      }
    ];
  });

  toggleSubmenu(id: string): void {
    if (this.adminState.sidebarCollapsed()) {
      this.adminState.toggleCollapse();
    }
    this.adminState.toggleSubmenu(id);
  }

  isItemActive(item: NavItem): boolean {
    const url = this.router.url;
    if (item.route && url.includes(item.route)) return true;
    if (item.children) {
      return item.children.some((c) => url.includes(c.route));
    }
    return false;
  }

  onLinkClick(): void {
    this.adminState.closeMobile();
  }
}
