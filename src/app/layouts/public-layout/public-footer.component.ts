import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-[#32302e] text-[#CFC8BB] border-t border-[#3E3C3A] mt-auto">
      <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-12 flex flex-wrap gap-10 justify-between">
        <div class="max-w-sm flex flex-col gap-3">
          <div class="flex items-center gap-3 text-white">
            <span class="w-8 h-8 bg-primary-container text-carbon font-extrabold flex items-center justify-center text-label-md rounded">
              F
            </span>
            <span class="font-bold tracking-wider text-headline-sm uppercase text-white">
              FIRMEZA
            </span>
          </div>
          <p class="text-body-sm text-[#A3A09D] leading-relaxed">
            Plataforma B2B para suministro de materiales de construcción y contratos de alquiler de maquinaria pesada en Colombia.
          </p>
          <span class="text-[12px] text-[#A3A09D]">
            NIT 901.458.723-1 • Bogotá D.C., Colombia
          </span>
        </div>

        <div class="flex flex-col gap-2.5">
          <h4 class="font-label-md text-label-md uppercase tracking-wider text-white font-semibold mb-1">
            Navegación
          </h4>
          <a routerLink="/materiales" class="text-body-sm hover:text-white transition-colors">Catálogo de Materiales</a>
          <a routerLink="/flota" class="text-body-sm hover:text-white transition-colors">Flota y Maquinaria</a>
          <a routerLink="/cotizaciones" class="text-body-sm hover:text-white transition-colors">Cotización de Alquiler</a>
          <a routerLink="/carrito" class="text-body-sm hover:text-white transition-colors">Carrito de Compras</a>
          <a routerLink="/proyectos" class="text-body-sm hover:text-white transition-colors">Proyectos Industriales</a>
        </div>

        <div class="flex flex-col gap-2.5">
          <h4 class="font-label-md text-label-md uppercase tracking-wider text-white font-semibold mb-1">
            Atención al Cliente
          </h4>
          <span class="text-body-sm">PBX: +57 (601) 745-9000</span>
          <span class="text-body-sm">Línea WhatsApp: +57 310 892 4400</span>
          <span class="text-body-sm">contacto&#64;firmeza.com.co</span>
          <span class="text-body-sm text-[#A3A09D]">Lunes a Viernes 7:00 a.m. - 5:30 p.m.</span>
        </div>
      </div>

      <div class="border-t border-[#3E3C3A] py-4 px-4 md:px-8 text-[12px] text-[#A3A09D]">
        <div class="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 FIRMEZA S.A.S. Todos los derechos reservados.</span>
          <span>Desarrollado para Célula Colossus • Angular 20 + .NET 10</span>
        </div>
      </div>
    </footer>
  `
})
export class PublicFooterComponent {}
