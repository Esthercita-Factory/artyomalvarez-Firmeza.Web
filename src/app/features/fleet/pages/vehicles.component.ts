import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Vehicle } from '@models/models';
import { ApiService } from '@services/api.service';
import { cop } from '@utils/catalog';
import { vehicleStatus, vehicleType } from '@utils/admin';
import { createLoader } from '@utils/util';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 text-label-sm uppercase tracking-wider text-secondary-label">
          <span>PORTAL CORPORATIVO</span>
          <span>/</span>
          <span class="text-carbon font-semibold">MAQUINARIA Y LOGÍSTICA</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-headline-xl text-headline-xl text-carbon font-bold leading-tight">
              Flota y Maquinaria Pesada
            </h1>
            <p class="font-body-md text-body-md text-secondary-label mt-1">
              Equipos de alto rendimiento disponibles para alquiler por obra o periodo continuo.
            </p>
          </div>

          <a
            routerLink="/cotizaciones"
            class="h-11 px-6 btn-primary-yellow font-semibold flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span class="material-symbols-outlined text-[20px]">calculate</span>
            <span>Cotizador en Línea</span>
          </a>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="bg-white border border-[#DEDCD8] rounded p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div class="relative w-full sm:max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-2.5 text-secondary-label text-[20px]">
            search
          </span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por placa, modelo o marca..."
            class="w-full h-10 pl-9 pr-3 bg-white border border-[#DEDCD8] rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
          />
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <select
            [ngModel]="selectedType()"
            (ngModelChange)="selectedType.set($event)"
            class="h-10 px-3 bg-white border border-[#DEDCD8] rounded text-carbon text-body-sm focus:border-carbon focus:outline-none w-full sm:w-auto"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="Maquinaria pesada">Maquinaria pesada</option>
            <option value="Camiones">Camiones</option>
            <option value="Remolques">Remolques</option>
          </select>
        </div>
      </div>

      <!-- Loading, Error or Fleet Cards -->
      @if (loader.loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1, 2, 3]; track i) {
            <div class="bg-white border border-[#DEDCD8] rounded h-[360px] p-5 flex flex-col gap-4 animate-shimmer">
              <div class="h-40 bg-[#EBEBEA] rounded"></div>
              <div class="h-5 bg-[#EBEBEA] rounded w-2/3"></div>
              <div class="h-4 bg-[#EBEBEA] rounded w-1/3"></div>
              <div class="mt-auto h-11 bg-[#EBEBEA] rounded"></div>
            </div>
          }
        </div>
      } @else if (loader.error()) {
        <div class="bg-white border border-[#FFCDD2] rounded p-12 text-center flex flex-col items-center justify-center gap-3">
          <span class="material-symbols-outlined text-[54px] text-error">cloud_off</span>
          <h2 class="font-headline-sm text-headline-sm text-error font-semibold">
            No se pudo cargar la flota de vehículos
          </h2>
          <p class="font-body-sm text-body-sm text-secondary-label max-w-md">
            {{ loader.error() }}
          </p>
          <button
            type="button"
            class="mt-2 px-5 py-2.5 bg-white border border-[#DEDCD8] rounded font-semibold text-carbon hover:bg-[#F4F4F2] transition-colors"
            (click)="loader.reload()"
          >
            Reintentar
          </button>
        </div>
      } @else if (filteredVehicles().length === 0) {
        <div class="bg-white border border-[#DEDCD8] rounded p-12 text-center flex flex-col items-center justify-center gap-3">
          <span class="material-symbols-outlined text-[54px] text-secondary-label">
            no_crash
          </span>
          <h2 class="font-headline-sm text-headline-sm text-carbon font-semibold">
            No hay vehículos que coincidan con los filtros
          </h2>
          <p class="font-body-sm text-body-sm text-secondary-label max-w-md">
            Pruebe modificando el término de búsqueda o seleccionando otro tipo de equipo.
          </p>
          <button
            type="button"
            class="mt-2 px-5 py-2.5 bg-white border border-[#DEDCD8] rounded font-semibold text-carbon hover:bg-[#F4F4F2] transition-colors"
            (click)="resetFilters()"
          >
            Restablecer Filtros
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (v of filteredVehicles(); track v.id) {
            @let st = getStatus(v);
            @let tp = getType(v);
            @let price = formatPrice(v.dailyRate);

            <article class="bg-white border border-[#DEDCD8] rounded flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <!-- Header with Machine Visual Icon -->
              <div class="h-44 bg-[#F4F4F2] border-b border-[#DEDCD8] flex flex-col items-center justify-center p-4 relative">
                <span class="material-symbols-outlined text-[58px] text-carbon/70">
                  {{ getVehicleIcon(tp) }}
                </span>
                <span class="absolute top-3 left-3 text-[11px] font-mono font-bold text-carbon bg-white px-2 py-0.5 rounded border border-[#DEDCD8]">
                  {{ v.plate }}
                </span>
                <span class="absolute top-3 right-3 text-[11px] font-semibold text-secondary-label">
                  {{ tp }}
                </span>
              </div>

              <!-- Card Body -->
              <div class="p-5 flex flex-col gap-2 flex-1 justify-between">
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[12px] font-semibold uppercase text-secondary-label">
                      {{ v.brand }} • Mod. {{ v.year }}
                    </span>
                    <span class="badge-status {{ st.cls }}">
                      {{ st.label }}
                    </span>
                  </div>

                  <h3 class="font-headline-sm text-headline-sm text-carbon font-semibold leading-tight">
                    {{ v.model }}
                  </h3>

                  <p class="font-body-sm text-body-sm text-secondary-label">
                    Capacidad de carga: <strong class="text-carbon font-semibold">{{ v.loadCapacity }}</strong>
                  </p>
                </div>

                <div class="mt-4 pt-3 border-t border-[#DEDCD8] flex flex-col gap-3">
                  <div class="flex items-baseline justify-between">
                    <span class="font-label-sm text-label-sm text-secondary-label">Tarifa diaria (+ IVA)</span>
                    <span class="font-headline-sm text-headline-sm text-carbon font-bold">
                      {{ price }}
                    </span>
                  </div>

                  <a
                    [routerLink]="['/cotizaciones']"
                    [queryParams]="{ vehicleId: v.id }"
                    class="w-full h-11 btn-outline font-semibold flex items-center justify-center gap-2 hover:border-carbon transition-colors"
                  >
                    <span class="material-symbols-outlined text-[18px]">request_quote</span>
                    <span>Cotizar este equipo</span>
                  </a>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `
})
export class VehiclesComponent {
  private readonly api = inject(ApiService);

  readonly loader = createLoader<Vehicle[]>(() => this.api.getVehicles(), []);

  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('ALL');

  readonly filteredVehicles = computed(() => {
    let list = this.loader.data();
    const query = this.searchQuery().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const typeFilter = this.selectedType();

    if (typeFilter !== 'ALL') {
      list = list.filter((v) => vehicleType(v).toLowerCase() === typeFilter.toLowerCase());
    }

    if (query) {
      list = list.filter((v) => {
        const p = (v.plate || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const m = (v.model || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const b = (v.brand || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return p.includes(query) || m.includes(query) || b.includes(query);
      });
    }

    return list;
  });

  getStatus(v: Vehicle) {
    return vehicleStatus(v);
  }

  getType(v: Vehicle) {
    return vehicleType(v);
  }

  formatPrice(rate: number) {
    return cop(rate);
  }

  getVehicleIcon(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('camion')) return 'local_shipping';
    if (t.includes('remolque')) return 'rv_hookup';
    return 'front_loader';
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('ALL');
  }
}
