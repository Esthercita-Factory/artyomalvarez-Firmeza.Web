import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertComponent } from '@components/alert.component';
import { PageHeaderComponent } from '@components/page-header.component';
import { TableStateComponent } from '@components/table-state.component';
import { Customer, Rental, Vehicle } from '@models/models';
import { ApiService } from '@services/api.service';
import { cop } from '@utils/catalog';
import { createLoader } from '@utils/util';

@Component({
  selector: 'app-admin-rentals',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, TableStateComponent, AlertComponent],
  template: `
    <section class="flex flex-col gap-6">
      <app-page-header
        [title]="'Contratos de Alquiler de Flota'"
        [subtitle]="'Administración y seguimiento de reservas, maquinaria pesada y contratos corporativos'"
      >
        <div class="flex items-center gap-3">
          <a
            routerLink="/cotizaciones"
            class="h-11 px-5 btn-primary-yellow font-semibold flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Nuevo Contrato / Cotización</span>
          </a>
        </div>
      </app-page-header>

      <app-alert [text]="pageAlert()" />

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <span class="font-label-sm text-label-sm text-secondary-label">Total Contratos</span>
          <span class="font-headline-lg text-headline-md text-carbon font-bold">
            {{ rentalsLoader.data().length }}
          </span>
          <span class="text-[12px] text-secondary-label">Histórico acumulado</span>
        </div>

        <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <span class="font-label-sm text-label-sm text-secondary-label">Alquileres Activos</span>
          <span class="font-headline-lg text-headline-md text-[#0B5CAD] font-bold">
            {{ activeCount() }}
          </span>
          <span class="text-[12px] text-secondary-label">Equipos actualmente en obra</span>
        </div>

        <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <span class="font-label-sm text-label-sm text-secondary-label">Facturación Flota</span>
          <span class="font-headline-lg text-headline-md text-[#1E7B3A] font-bold">
            {{ totalRevenueFormatted() }}
          </span>
          <span class="text-[12px] text-secondary-label">Monto total contratos</span>
        </div>

        <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <span class="font-label-sm text-label-sm text-secondary-label">Vehículos en Flota</span>
          <span class="font-headline-lg text-headline-md text-carbon font-bold">
            {{ vehiclesLoader.data().length }}
          </span>
          <span class="text-[12px] text-secondary-label">Maquinaria y transporte</span>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="bg-white institutional-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div class="relative w-full sm:w-80">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-secondary-label text-[18px]">
              search
            </span>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Buscar por contrato, placa o cliente..."
              class="w-full h-10 pl-9 pr-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
            />
          </div>

          <select
            [ngModel]="selectedStatus()"
            (ngModelChange)="selectedStatus.set($event)"
            class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="1">Activos</option>
            <option value="0">Pendientes</option>
            <option value="2">Completados</option>
            <option value="3">Cancelados</option>
          </select>
        </div>

        <button
          type="button"
          (click)="reloadAll()"
          class="h-10 px-3 institutional-border rounded-xl font-body-sm text-secondary-label hover:text-carbon hover:bg-warm-surface flex items-center gap-1.5 self-end md:self-auto transition-colors"
          title="Recargar contratos"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- Contracts Table -->
      <div class="bg-white institutional-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <app-table-state
          [loading]="rentalsLoader.loading()"
          [error]="rentalsLoader.error()"
          [empty]="filteredRentals().length === 0"
          [emptyIcon]="'front_loader'"
          [emptyTitle]="'Sin contratos de alquiler'"
          [emptyText]="'No se encontraron contratos que coincidan con los criterios seleccionados.'"
          [resettable]="searchQuery() !== '' || selectedStatus() !== 'ALL'"
          (retry)="reloadAll()"
          (reset)="resetFilters()"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-warm-surface border-b-institutional text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">Contrato / Ref</th>
                  <th class="py-3 px-6 font-semibold">Vehículo / Maquinaria</th>
                  <th class="py-3 px-6 font-semibold">Cliente Solicitante</th>
                  <th class="py-3 px-6 font-semibold">Periodo de Operación</th>
                  <th class="py-3 px-6 font-semibold">Días</th>
                  <th class="py-3 px-6 font-semibold">Total (+IVA)</th>
                  <th class="py-3 px-6 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (r of filteredRentals(); track r.id) {
                  @let v = getVehicle(r.vehicleId);
                  @let c = getCustomer(r.customerId);

                  <tr class="hover:bg-[#FDFBF7]">
                    <td class="py-3.5 px-6 font-mono font-bold text-carbon">
                      ALQ-{{ r.id.substring(0, 8).toUpperCase() }}
                    </td>

                    <td class="py-3.5 px-6 text-carbon">
                      @if (v) {
                        <div class="flex flex-col">
                          <span class="font-semibold">{{ v.plate }} — {{ v.brand }} {{ v.model }}</span>
                          <span class="text-[12px] text-secondary-label">Tarifa: {{ formatPrice(r.dailyRate || v.dailyRate) }}/día</span>
                        </div>
                      } @else {
                        <span class="font-mono text-secondary-label">ID: {{ r.vehicleId.substring(0, 8) }}</span>
                      }
                    </td>

                    <td class="py-3.5 px-6 text-carbon">
                      @if (c) {
                        <div class="flex flex-col">
                          <span class="font-medium">{{ c.firstName }} {{ c.lastName }}</span>
                          <span class="text-[12px] text-secondary-label">{{ c.documentType }} {{ c.documentNumber }} • {{ c.email }}</span>
                        </div>
                      } @else {
                        <span class="font-mono text-secondary-label">Cliente: {{ r.customerId.substring(0, 8) }}</span>
                      }
                    </td>

                    <td class="py-3.5 px-6 text-secondary-label">
                      <div class="flex flex-col">
                        <span>{{ formatDate(r.startDate) }}</span>
                        <span class="text-[11px] text-secondary-label">hasta {{ formatDate(r.endDate) }}</span>
                      </div>
                    </td>

                    <td class="py-3.5 px-6 text-carbon font-semibold">
                      {{ r.daysRented }} d
                    </td>

                    <td class="py-3.5 px-6 font-bold text-carbon font-mono">
                      {{ formatPrice(r.total) }}
                    </td>

                    <td class="py-3.5 px-6">
                      <span class="badge-status {{ getStatusClass(r.status) }}">
                        {{ getStatusLabel(r.status) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-table-state>
      </div>
    </section>
  `
})
export class AdminRentalsComponent {
  private readonly api = inject(ApiService);

  readonly rentalsLoader = createLoader<Rental[]>(() => this.api.getRentals(), []);
  readonly vehiclesLoader = createLoader<Vehicle[]>(() => this.api.getVehicles(), []);
  readonly customersLoader = createLoader<Customer[]>(() => this.api.getCustomers(), []);

  readonly searchQuery = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');
  readonly pageAlert = signal<string | null>(null);

  readonly activeCount = computed(() => {
    return this.rentalsLoader.data().filter((r) => {
      const s = String(r.status).toLowerCase();
      return s === '1' || s.includes('act');
    }).length;
  });

  readonly totalRevenueFormatted = computed(() => {
    const sum = this.rentalsLoader.data().reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    return cop(sum);
  });

  readonly filteredRentals = computed(() => {
    let list = this.rentalsLoader.data();
    const query = this.searchQuery().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const status = this.selectedStatus();

    if (status !== 'ALL') {
      list = list.filter((r) => {
        const s = String(r.status).toLowerCase();
        if (status === '1') return s === '1' || s.includes('act');
        if (status === '0') return s === '0' || s.includes('pend');
        if (status === '2') return s === '2' || s.includes('comp');
        if (status === '3') return s === '3' || s.includes('canc');
        return s === status;
      });
    }

    if (query) {
      list = list.filter((r) => {
        const rid = r.id.toLowerCase();
        const v = this.getVehicle(r.vehicleId);
        const c = this.getCustomer(r.customerId);

        const vText = v ? `${v.plate} ${v.brand} ${v.model}`.toLowerCase() : '';
        const cText = c ? `${c.firstName} ${c.lastName} ${c.documentNumber} ${c.email}`.toLowerCase() : '';

        return rid.includes(query) || vText.includes(query) || cText.includes(query);
      });
    }

    return list;
  });

  getVehicle(id: string): Vehicle | undefined {
    return this.vehiclesLoader.data().find((v) => v.id === id);
  }

  getCustomer(id: string): Customer | undefined {
    return this.customersLoader.data().find((c) => c.id === id);
  }

  formatPrice(p: number | undefined | null): string {
    return cop(p);
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('es-CO');
    } catch {
      return d;
    }
  }

  getStatusClass(s: string | number): string {
    const val = String(s).toLowerCase();
    if (val === '1' || val.includes('act')) return 'status-activo';
    if (val === '0' || val.includes('pend')) return 'status-alerta';
    if (val === '2' || val.includes('comp')) return 'status-disponible';
    if (val === '3' || val.includes('canc')) return 'status-agotado';
    return 'status-neutral';
  }

  getStatusLabel(s: string | number): string {
    const val = String(s).toLowerCase();
    if (val === '1' || val.includes('act')) return 'Activo';
    if (val === '0' || val.includes('pend')) return 'Pendiente';
    if (val === '2' || val.includes('comp')) return 'Completado';
    if (val === '3' || val.includes('canc')) return 'Cancelado';
    return String(s);
  }

  reloadAll(): void {
    this.rentalsLoader.reload();
    this.vehiclesLoader.reload();
    this.customersLoader.reload();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('ALL');
  }
}
