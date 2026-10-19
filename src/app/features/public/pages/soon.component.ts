import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-soon',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-16 flex flex-col items-center justify-center text-center gap-5">
      <div class="w-16 h-16 rounded-2xl bg-warm-surface border border-[#DEDCD8] flex items-center justify-center text-carbon shadow-sm">
        <span class="material-symbols-outlined text-[36px]">engineering</span>
      </div>

      <div class="flex flex-col gap-2 max-w-lg">
        <span class="text-label-sm uppercase tracking-widest font-bold text-secondary-label">
          Módulo en Desarrollo
        </span>
        <h1 class="font-headline-xl text-headline-lg text-carbon font-bold">
          Proyectos Industriales
        </h1>
        <p class="font-body-md text-body-md text-secondary-label">
          Próximamente podrá gestionar licitaciones, cronogramas de obra y aprovisionamiento directo en sitio para grandes desarrollos de infraestructura en Colombia.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 mt-4">
        <a
          routerLink="/materiales"
          class="h-11 px-6 btn-primary-yellow font-semibold flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-[20px]">storefront</span>
          <span>Explorar Catálogo de Materiales</span>
        </a>
        <a
          routerLink="/flota"
          class="h-11 px-6 btn-outline font-semibold flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-[20px]">local_shipping</span>
          <span>Ver Flota y Maquinaria</span>
        </a>
      </div>
    </div>
  `
})
export class SoonComponent {}
