import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertComponent } from '@components/alert.component';
import { TableStateComponent } from '@components/table-state.component';
import { Customer, Rental, RentalQuote, Vehicle } from '@models/models';
import { ApiService } from '@services/api.service';
import { AuthService } from '@services/auth.service';
import { cop } from '@utils/catalog';
import { createLoader, errMsg } from '@utils/util';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [FormsModule, AlertComponent, TableStateComponent],
  template: `
    <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 text-label-sm uppercase tracking-wider text-secondary-label">
          <span>PORTAL CORPORATIVO</span>
          <span>/</span>
          <span class="text-carbon font-semibold">COTIZACIÓN DE ALQUILER</span>
        </div>

        <div>
          <h1 class="font-headline-xl text-headline-xl text-carbon font-bold leading-tight">
            Alquiler de Maquinaria y Flota
          </h1>
          <p class="font-body-md text-body-md text-secondary-label mt-1">
            Simule el costo operativo y solicite la reserva de vehículos y maquinaria pesada para su proyecto.
          </p>
        </div>
      </div>

      <app-alert [text]="formError()" />

      @if (formSuccess()) {
        <div class="p-4 rounded-xl institutional-border bg-[#E8F5E9] text-[#1E7B3A] border-[#A5D6A7] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">check_circle</span>
            <span class="text-body-sm font-semibold">{{ formSuccess() }}</span>
          </div>
          <button type="button" (click)="formSuccess.set(null)" class="text-[#1E7B3A] hover:opacity-75">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      }

      <!-- Form Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Input Form -->
        <div class="lg:col-span-2 bg-white border border-[#DEDCD8] rounded p-6 flex flex-col gap-5 shadow-sm">
          <h2 class="font-headline-sm text-headline-sm text-carbon font-semibold border-b border-[#DEDCD8] pb-3">
            Datos del Contrato de Alquiler
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Vehicle Selector -->
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label for="vehicleId" class="font-label-sm text-label-sm text-carbon font-medium">
                Seleccione el Vehículo o Maquinaria *
              </label>
              <select
                id="vehicleId"
                name="vehicleId"
                [(ngModel)]="selectedVehicleId"
                (ngModelChange)="onVehicleChange()"
                class="h-11 px-3 bg-white border border-[#DEDCD8] rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
              >
                <option value="">-- Seleccione un equipo disponible --</option>
                @for (v of vehiclesLoader.data(); track v.id) {
                  <option [value]="v.id">
                    {{ v.plate }} — {{ v.brand }} {{ v.model }} ({{ formatCurrency(v.dailyRate) }}/día)
                  </option>
                }
              </select>
            </div>

            <!-- Customer Selector (Solo para Administrador) -->
            @if (auth.isAdmin()) {
              <div class="flex flex-col gap-1.5 sm:col-span-2">
                <label for="customerId" class="font-label-sm text-label-sm text-carbon font-medium">
                  Cliente Solicitante *
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  [(ngModel)]="selectedCustomerId"
                  class="h-11 px-3 bg-white border border-[#DEDCD8] rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
                >
                  <option value="">-- Seleccione el cliente registrado --</option>
                  @for (c of customers(); track c.id) {
                    <option [value]="c.id">
                      {{ c.documentType }} {{ c.documentNumber }} — {{ c.firstName }} {{ c.lastName }} ({{ c.email }})
                    </option>
                  }
                </select>
              </div>
            }

            <!-- Start Date -->
            <div class="flex flex-col gap-1.5">
              <label for="startDate" class="font-label-sm text-label-sm text-carbon font-medium">
                Fecha de Inicio *
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                [(ngModel)]="startDate"
                (ngModelChange)="quoteResult.set(null)"
                class="h-11 px-3 bg-white border border-[#DEDCD8] rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
              />
            </div>

            <!-- End Date -->
            <div class="flex flex-col gap-1.5">
              <label for="endDate" class="font-label-sm text-label-sm text-carbon font-medium">
                Fecha de Finalización *
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                [(ngModel)]="endDate"
                (ngModelChange)="quoteResult.set(null)"
                class="h-11 px-3 bg-white border border-[#DEDCD8] rounded text-carbon text-body-sm focus:border-carbon focus:outline-none"
              />
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#DEDCD8]">
            <button
              type="button"
              [disabled]="quoting() || !isFormValid()"
              (click)="onCalculateQuote()"
              class="h-11 px-5 btn-outline font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              @if (quoting()) {
                <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                <span>Calculando...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">calculate</span>
                <span>Calcular Cotización</span>
              }
            </button>

            <button
              type="button"
              [disabled]="submitting() || !isFormValid()"
              (click)="onSubmitRental()"
              class="h-11 px-6 btn-primary-yellow font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              @if (submitting()) {
                <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                <span>Registrando...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">send</span>
                <span>Solicitar Alquiler</span>
              }
            </button>
          </div>
        </div>

        <!-- Quote Summary Card -->
        <div class="bg-white border border-[#DEDCD8] rounded p-6 flex flex-col justify-between shadow-sm">
          <div class="flex flex-col gap-4">
            <h3 class="font-title-md text-title-md text-carbon font-semibold border-b border-[#DEDCD8] pb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary-container">receipt_long</span>
              <span>Resumen de Cotización</span>
            </h3>

            @if (quoteResult(); as q) {
              <div class="flex flex-col gap-3 font-body-sm text-body-sm">
                <div class="flex justify-between items-center text-secondary-label">
                  <span>Días de alquiler</span>
                  <span class="font-bold text-carbon">{{ q.days ?? q.daysRented ?? 0 }} días</span>
                </div>
                @if (q.dailyRate) {
                  <div class="flex justify-between items-center text-secondary-label">
                    <span>Tarifa diaria</span>
                    <span class="text-carbon font-medium">{{ formatCurrency(q.dailyRate) }}</span>
                  </div>
                }
                <div class="flex justify-between items-center text-secondary-label">
                  <span>Subtotal</span>
                  <span class="text-carbon font-medium">{{ formatCurrency(q.subtotal) }}</span>
                </div>
                <div class="flex justify-between items-center text-secondary-label">
                  <span>IVA estimado (19%)</span>
                  <span class="text-carbon font-medium">{{ formatCurrency(q.tax ?? (q.subtotal * 0.19)) }}</span>
                </div>
                <div class="pt-3 border-t border-[#DEDCD8] flex justify-between items-baseline">
                  <span class="font-semibold text-carbon text-title-md">Total Estimado</span>
                  <span class="font-headline-md text-headline-sm text-carbon font-bold">
                    {{ formatCurrency(q.total) }}
                  </span>
                </div>
              </div>
            } @else {
              <div class="py-8 text-center flex flex-col items-center justify-center gap-2 text-secondary-label">
                <span class="material-symbols-outlined text-[44px] text-secondary-label/60">
                  pending_actions
                </span>
                <p class="font-body-sm text-body-sm">
                  Complete las fechas y presione "Calcular Cotización" para ver el desglose financiero.
                </p>
              </div>
            }
          </div>

          <div class="text-[11px] text-secondary-label pt-4 border-t border-[#DEDCD8] mt-4">
            Las cotizaciones son vinculantes por 15 días calendario y están sujetas a disponibilidad operativa en patio.
          </div>
        </div>
      </div>

      <!-- Existing Rentals Table -->
      <div class="bg-white border border-[#DEDCD8] rounded overflow-hidden shadow-sm flex flex-col mt-4">
        <div class="px-6 py-4 border-b border-[#DEDCD8] flex items-center justify-between">
          <div>
            <h2 class="font-headline-sm text-headline-sm text-carbon font-semibold">
              Historial de Contratos de Alquiler
            </h2>
            <p class="font-body-sm text-body-sm text-secondary-label">
              Contratos vigentes e históricos asociados a su cuenta corporativa
            </p>
          </div>
          <button
            type="button"
            (click)="rentalsLoader.reload()"
            class="h-9 px-3 btn-outline rounded text-label-sm font-semibold flex items-center gap-1.5"
            title="Recargar tabla"
          >
            <span class="material-symbols-outlined text-[16px]">refresh</span>
            <span>Actualizar</span>
          </button>
        </div>

        <app-table-state
          [loading]="rentalsLoader.loading()"
          [error]="rentalsLoader.error()"
          [empty]="rentalsLoader.data().length === 0"
          [emptyTitle]="'Sin alquileres registrados'"
          [emptyText]="'No se encontraron contratos de alquiler en su historial.'"
          (retry)="rentalsLoader.reload()"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F4F4F2] border-b border-[#DEDCD8] text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">Contrato / Ref</th>
                  <th class="py-3 px-6 font-semibold">Equipo</th>
                  <th class="py-3 px-6 font-semibold">Periodo</th>
                  <th class="py-3 px-6 font-semibold">Días</th>
                  <th class="py-3 px-6 font-semibold">Total (+IVA)</th>
                  <th class="py-3 px-6 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (r of rentalsLoader.data(); track r.id) {
                  <tr class="hover:bg-[#FAF9F7]">
                    <td class="py-3.5 px-6 font-mono font-semibold text-carbon">
                      ALQ-{{ r.id.substring(0, 8).toUpperCase() }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-medium">
                      {{ resolveVehicleName(r.vehicleId) }}
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label">
                      {{ formatDate(r.startDate) }} al {{ formatDate(r.endDate) }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon">
                      {{ r.daysRented }} días
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-bold">
                      {{ formatCurrency(r.total) }}
                    </td>
                    <td class="py-3.5 px-6">
                      <span class="badge-status status-activo">
                        {{ formatRentalStatus(r.status) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-table-state>
      </div>
    </div>
  `
})
export class RentalsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly vehiclesLoader = createLoader<Vehicle[]>(() => this.api.getVehicles(), []);
  readonly rentalsLoader = createLoader<Rental[]>(() => this.api.getRentals(), []);

  readonly customers = signal<Customer[]>([]);

  selectedVehicleId = '';
  selectedCustomerId = '';
  startDate = '';
  endDate = '';

  readonly quoteResult = signal<RentalQuote | null>(null);
  readonly quoting = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly formError = signal<string | null>(null);
  readonly formSuccess = signal<string | null>(null);

  ngOnInit(): void {
    const qv = this.route.snapshot.queryParamMap.get('vehicleId');
    if (qv) {
      this.selectedVehicleId = qv;
    }

    // Cargar clientes solo si es admin
    if (this.auth.isAdmin()) {
      this.api.getCustomers().subscribe({
        next: (custs) => this.customers.set(custs),
        error: () => {} // Error tolerado
      });
    }
  }

  isFormValid(): boolean {
    if (!this.selectedVehicleId || !this.startDate || !this.endDate) return false;
    if (this.auth.isAdmin() && !this.selectedCustomerId) return false;
    return new Date(this.startDate) <= new Date(this.endDate);
  }

  onVehicleChange(): void {
    this.quoteResult.set(null);
  }

  onCalculateQuote(): void {
    if (!this.isFormValid()) {
      this.formError.set('Verifique los campos seleccionados y las fechas.');
      return;
    }

    this.quoting.set(true);
    this.formError.set(null);

    this.api
      .quoteRental({
        vehicleId: this.selectedVehicleId,
        startDate: this.startDate,
        endDate: this.endDate,
        customerId: this.selectedCustomerId || undefined
      })
      .subscribe({
        next: (quote) => {
          this.quoteResult.set(quote);
          this.quoting.set(false);
        },
        error: (err) => {
          this.quoting.set(false);
          this.formError.set(errMsg(err));
        }
      });
  }

  onSubmitRental(): void {
    if (!this.isFormValid()) {
      this.formError.set('Por favor complete todos los datos requeridos.');
      return;
    }

    this.submitting.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);

    this.api
      .createRental({
        vehicleId: this.selectedVehicleId,
        startDate: this.startDate,
        endDate: this.endDate,
        customerId: this.selectedCustomerId || undefined
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.formSuccess.set('¡Solicitud de alquiler registrada con éxito!');
          this.quoteResult.set(null);
          this.rentalsLoader.reload();
        },
        error: (err) => {
          this.submitting.set(false);
          this.formError.set(errMsg(err));
        }
      });
  }

  resolveVehicleName(vehicleId: string): string {
    const v = this.vehiclesLoader.data().find((item) => item.id === vehicleId);
    return v ? `${v.plate} - ${v.brand} ${v.model}` : `ID: ${vehicleId.substring(0, 8)}`;
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

  formatRentalStatus(s: string | number): string {
    const val = String(s).toLowerCase();
    if (val === '0' || val.includes('pend')) return 'Pendiente';
    if (val === '1' || val.includes('act')) return 'Activo';
    if (val === '2' || val.includes('comp')) return 'Completado';
    if (val === '3' || val.includes('canc')) return 'Cancelado';
    return String(s);
  }

  formatCurrency(n: number | undefined | null): string {
    return cop(n);
  }
}
