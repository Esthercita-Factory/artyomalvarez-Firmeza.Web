import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="bg-[#32302e] text-[#E8E1D4] border-b border-[#3E3C3A]">
      <!-- Top info bar -->
      <div class="border-b border-[#3E3C3A] text-[11px] uppercase tracking-wider text-[#A3A09D] px-4 md:px-8 py-2">
        <div class="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <span class="font-semibold text-white">FIRMEZA S.A.S.</span>
            <span>•</span>
            <span>Portal Corporativo B2B</span>
          </div>
          <div class="flex items-center gap-6">
            <a routerLink="/cotizaciones" class="hover:text-white transition-colors">Solicitar cotización</a>
            <span class="hidden sm:inline">Línea Nacional: (601) 745-9000</span>
          </div>
        </div>
      </div>

      <!-- Main Navbar -->
      <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <!-- Logo -->
        <a routerLink="/materiales" class="flex items-center gap-3 text-white no-underline group" aria-label="Firmeza Inicio">
          <span class="w-9 h-9 bg-primary-container text-carbon font-extrabold flex items-center justify-center text-headline-sm rounded">
            F
          </span>
          <div class="flex flex-col">
            <span class="font-bold tracking-wider text-headline-sm uppercase text-white leading-none">
              FIRMEZA
            </span>
            <span class="text-[10px] text-primary-container tracking-widest uppercase font-medium">
              Obra sólida
            </span>
          </div>
        </a>

        <!-- Navigation Links -->
        <nav class="flex items-center gap-1 sm:gap-6 font-medium text-body-sm text-[#CFC8BB]">
          <a
            routerLink="/materiales"
            routerLinkActive="active-nav"
            class="nav-link px-2 py-1"
          >
            Materiales
          </a>
          <a
            routerLink="/flota"
            routerLinkActive="active-nav"
            class="nav-link px-2 py-1"
          >
            Flota
          </a>
          <a
            routerLink="/cotizaciones"
            routerLinkActive="active-nav"
            class="nav-link px-2 py-1"
          >
            Cotizaciones
          </a>
          <a
            routerLink="/carrito"
            routerLinkActive="active-nav"
            class="nav-link px-2 py-1 flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">shopping_cart</span>
            <span>Carrito</span>
            @if (cartCount() > 0) {
              <span class="bg-primary-container text-carbon text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                {{ cartCount() }}
              </span>
            }
          </a>

          @if (admin()) {
            <a
              routerLink="/admin"
              class="px-3 py-1.5 rounded bg-[#383533] border border-[#FDDA24] text-white hover:bg-[#45423F] text-label-sm font-semibold flex items-center gap-1.5 ml-2"
            >
              <span class="material-symbols-outlined text-[16px] text-primary-container">admin_panel_settings</span>
              <span>Panel Admin</span>
            </a>
          }

          @if (loggedIn()) {
            <button
              type="button"
              (click)="logout.emit()"
              class="px-3 py-1.5 rounded border border-[#615E5C] text-[#E8E1D4] hover:bg-[#383533] text-label-sm flex items-center gap-1.5 ml-2 transition-colors"
              title="Cerrar sesión"
            >
              <span class="material-symbols-outlined text-[16px]">logout</span>
              <span class="hidden md:inline">Salir</span>
            </button>
          } @else {
            <a
              routerLink="/login"
              class="btn-primary-yellow h-9 px-4 rounded text-label-sm font-semibold flex items-center gap-1.5 ml-2"
            >
              <span class="material-symbols-outlined text-[16px]">lock</span>
              <span>Ingresar</span>
            </a>
          }
        </nav>
      </div>
    </header>
  `
})
export class PublicHeaderComponent {
  readonly cartCount = input<number>(0);
  readonly loggedIn = input<boolean>(false);
  readonly admin = input<boolean>(false);

  readonly logout = output<void>();
}
