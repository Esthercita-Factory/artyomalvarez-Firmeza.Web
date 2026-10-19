import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-full md:w-64 bg-carbon text-white flex-shrink-0 flex flex-col justify-between border-r-institutional z-20">
      <div class="flex flex-col">
        <!-- Brand Header in Sidebar -->
        <div class="h-16 px-6 flex items-center justify-between border-b border-[#3E3C3A]">
          <div class="flex items-center gap-3">
            <span class="w-7 h-7 bg-primary-container text-carbon font-extrabold flex items-center justify-center text-label-md rounded">
              F
            </span>
            <div class="flex flex-col">
              <span class="font-headline-sm text-label-md tracking-wider font-bold text-white uppercase">FIRMEZA</span>
              <span class="font-label-sm text-[10px] text-primary-container uppercase tracking-wider font-semibold">Panel Administrativo</span>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="p-3 flex flex-col gap-1">
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="tab-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-admin tab-inactive"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </div>
            <span class="text-[11px] font-mono text-[#A3A09D]">/admin</span>
          </a>

          <a
            routerLink="/admin/materiales"
            routerLinkActive="tab-active"
            class="nav-admin tab-inactive"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px]">category</span>
              <span>Materiales</span>
            </div>
            <span class="text-[11px] font-mono text-[#A3A09D]">/admin/mat</span>
          </a>

          <a
            routerLink="/admin/flota"
            routerLinkActive="tab-active"
            class="nav-admin tab-inactive"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px]">local_shipping</span>
              <span>Flota</span>
            </div>
            <span class="text-[11px] font-mono text-[#A3A09D]">/admin/flota</span>
          </a>

          <a
            routerLink="/admin/clientes"
            routerLinkActive="tab-active"
            class="nav-admin tab-inactive"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px]">group</span>
              <span>Clientes</span>
            </div>
            <span class="text-[11px] font-mono text-[#A3A09D]">/admin/cli</span>
          </a>

          <a
            routerLink="/admin/ventas"
            routerLinkActive="tab-active"
            class="nav-admin tab-inactive"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px]">receipt_long</span>
              <span>Ventas</span>
            </div>
            <span class="text-[11px] font-mono text-[#A3A09D]">/admin/ven</span>
          </a>

          <a
            routerLink="/admin/excel"
            routerLinkActive="tab-active"
            class="nav-admin tab-inactive"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px]">table_chart</span>
              <span>Excel</span>
            </div>
            <span class="text-[11px] font-mono text-[#A3A09D]">/admin/excel</span>
          </a>
        </nav>
      </div>

      <!-- Quick Links & Accounting Period -->
      <div class="p-3 border-t border-[#3E3C3A] flex flex-col gap-2">
        <div class="flex flex-col gap-1">
          <a
            routerLink="/materiales"
            class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl font-body-sm text-body-sm text-[#BDBAB7] hover:text-white hover:bg-[#383533] transition-colors"
          >
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">storefront</span>
              <span>Ver Portal Público</span>
            </span>
            <span class="text-[10px] font-mono text-[#A3A09D]">/portal</span>
          </a>
          <div class="flex items-center justify-between px-3 py-1 text-[11px] text-[#A3A09D]">
            <span>Páginas de Error:</span>
            <div class="flex gap-1.5 font-mono">
              <a routerLink="/403" class="hover:text-white hover:underline">403</a>
              <span>|</span>
              <a routerLink="/404" class="hover:text-white hover:underline">404</a>
              <span>|</span>
              <a routerLink="/500" class="hover:text-white hover:underline">500</a>
            </div>
          </div>
        </div>
        <div class="px-3 py-2 bg-[#1F1E1D] rounded-xl flex items-center justify-between text-[11px] text-[#A3A09D]">
          <span>Periodo Contable</span>
          <span class="font-semibold text-white">{{ period() }}</span>
        </div>
      </div>
    </aside>
  `
})
export class AdminSidebarComponent {
  readonly period = input<string>('Octubre 2026');
}
