import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '@components/alert.component';
import { ModalComponent } from '@components/modal.component';
import { PageHeaderComponent } from '@components/page-header.component';
import { TableStateComponent } from '@components/table-state.component';
import { Vehicle, VehicleInput } from '@models/models';
import { ApiService } from '@services/api.service';
import { cop } from '@utils/catalog';
import { num, vehicleStatus, vehicleType } from '@utils/admin';
import { createLoader, errMsg } from '@utils/util';

@Component({
  selector: 'app-admin-fleet',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    TableStateComponent,
    ModalComponent,
    AlertComponent
  ],
  template: `
    <section class="flex flex-col gap-6">
      <app-page-header
        [title]="'Flota y Maquinaria Pesada'"
        [subtitle]="'Control de vehículos, volquetas y maquinaria pesada para operaciones y alquiler'"
      >
        <button
          type="button"
          (click)="openCreateModal()"
          class="h-11 px-5 btn-primary-yellow font-semibold flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[20px]">add</span>
          <span>+ Registrar equipo</span>
        </button>
      </app-page-header>

      <app-alert [text]="pageAlert()" />

      <!-- Filters Row -->
      <div class="bg-white institutional-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <div class="relative min-w-[260px] flex-1">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-secondary-label text-[20px]">
              search
            </span>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Buscar por placa, modelo o marca..."
              class="w-full h-10 pl-9 pr-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
            />
          </div>

          <select
            [ngModel]="selectedType()"
            (ngModelChange)="selectedType.set($event)"
            class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="Maquinaria pesada">Maquinaria pesada</option>
            <option value="Camiones">Camiones</option>
            <option value="Remolques">Remolques</option>
          </select>

          <select
            [ngModel]="selectedStatus()"
            (ngModelChange)="selectedStatus.set($event)"
            class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Alquilado">Alquilado</option>
            <option value="En mantenimiento">En mantenimiento</option>
          </select>
        </div>

        <button
          type="button"
          (click)="loader.reload()"
          class="h-10 px-3 institutional-border rounded-xl font-body-sm text-secondary-label hover:text-carbon hover:bg-warm-surface flex items-center gap-1.5 self-end lg:self-auto transition-colors"
          title="Recargar flota"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- Fleet Table -->
      <div class="bg-white institutional-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <app-table-state
          [loading]="loader.loading()"
          [error]="loader.error()"
          [empty]="filteredVehicles().length === 0"
          [emptyIcon]="'no_crash'"
          [emptyTitle]="'Sin vehículos registrados'"
          [emptyText]="'No se encontraron vehículos o maquinaria que coincidan con la búsqueda.'"
          [resettable]="searchQuery() !== '' || selectedType() !== 'ALL' || selectedStatus() !== 'ALL'"
          (retry)="loader.reload()"
          (reset)="resetFilters()"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-warm-surface border-b-institutional text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">Placa / Identificador</th>
                  <th class="py-3 px-6 font-semibold">Marca, Modelo y Año</th>
                  <th class="py-3 px-6 font-semibold">Tipo</th>
                  <th class="py-3 px-6 font-semibold">Capacidad</th>
                  <th class="py-3 px-6 font-semibold">Tarifa Diaria</th>
                  <th class="py-3 px-6 font-semibold">Estado</th>
                  <th class="py-3 px-6 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (v of filteredVehicles(); track v.id) {
                  @let badge = getBadge(v);
                  @let tp = getType(v);

                  <tr class="hover:bg-[#FDFBF7]">
                    <td class="py-3.5 px-6 font-semibold text-carbon font-mono">
                      {{ v.plate }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon">
                      <span class="font-medium">{{ v.brand }} {{ v.model }}</span>
                      <span class="text-secondary-label ml-1.5 text-[12px] font-normal">({{ v.year }})</span>
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label">
                      {{ tp }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-medium">
                      {{ v.loadCapacity }}
                    </td>
                    <td class="py-3.5 px-6 font-semibold text-carbon">
                      {{ formatPrice(v.dailyRate) }}
                    </td>
                    <td class="py-3.5 px-6">
                      <span class="badge-status {{ badge.cls }}">
                        {{ badge.label }}
                      </span>
                    </td>
                    <td class="py-3.5 px-6 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          (click)="openEditModal(v)"
                          class="p-1.5 text-secondary-label hover:text-carbon rounded transition-colors"
                          title="Editar equipo"
                          aria-label="Editar"
                        >
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          (click)="onDeleteVehicle(v)"
                          class="p-1.5 text-secondary-label hover:text-error rounded transition-colors"
                          title="Eliminar equipo"
                          aria-label="Eliminar"
                        >
                          <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-table-state>
      </div>

      <!-- Create / Edit Modal -->
      @if (showModal()) {
        <app-modal
          [title]="editingId() ? 'Editar Equipo / Maquinaria' : 'Registrar Nuevo Equipo'"
          [icon]="'local_shipping'"
          (close)="closeModal()"
        >
          <app-alert [text]="modalError()" />

          <form class="flex flex-col gap-4" (ngSubmit)="onSaveVehicle()">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="plate" class="font-label-sm text-label-sm text-carbon font-medium">
                  Placa o Identificador *
                </label>
                <input
                  id="plate"
                  name="plate"
                  type="text"
                  required
                  [(ngModel)]="formPlate"
                  placeholder="p.ej. VOL-KW15 o WDF-123"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="type" class="font-label-sm text-label-sm text-carbon font-medium">
                  Tipo de maquinaria *
                </label>
                <select
                  id="type"
                  name="type"
                  [(ngModel)]="formType"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                >
                  <option [value]="0">Maquinaria pesada</option>
                  <option [value]="1">Camiones</option>
                  <option [value]="2">Remolques</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="v-brand" class="font-label-sm text-label-sm text-carbon font-medium">
                  Marca *
                </label>
                <input
                  id="v-brand"
                  name="brand"
                  type="text"
                  required
                  [(ngModel)]="formBrand"
                  placeholder="Caterpillar / Kenworth"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="v-model" class="font-label-sm text-label-sm text-carbon font-medium">
                  Modelo *
                </label>
                <input
                  id="v-model"
                  name="model"
                  type="text"
                  required
                  [(ngModel)]="formModel"
                  placeholder="T800 / 320D"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="v-year" class="font-label-sm text-label-sm text-carbon font-medium">
                  Año *
                </label>
                <input
                  id="v-year"
                  name="year"
                  type="number"
                  required
                  [(ngModel)]="formYear"
                  placeholder="2024"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="dailyRate" class="font-label-sm text-label-sm text-carbon font-medium">
                  Tarifa Diaria ($ COP) *
                </label>
                <input
                  id="dailyRate"
                  name="dailyRate"
                  type="number"
                  required
                  min="0"
                  step="1000"
                  [(ngModel)]="formDailyRate"
                  placeholder="850000"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="loadCapacity" class="font-label-sm text-label-sm text-carbon font-medium">
                  Capacidad de Carga *
                </label>
                <input
                  id="loadCapacity"
                  name="loadCapacity"
                  type="text"
                  required
                  [(ngModel)]="formCapacity"
                  placeholder="p.ej. 15 m³ / 20 Ton"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="status" class="font-label-sm text-label-sm text-carbon font-medium">
                  Estado Operativo
                </label>
                <select
                  id="status"
                  name="status"
                  [(ngModel)]="formStatus"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                >
                  <option [value]="0">Disponible</option>
                  <option [value]="1">Alquilado</option>
                  <option [value]="2">En mantenimiento</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t-institutional">
              <button
                type="button"
                (click)="closeModal()"
                class="h-11 px-5 institutional-border rounded-xl font-label-md text-carbon hover:bg-warm-surface transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                [disabled]="savingModal()"
                class="h-11 px-6 btn-primary-yellow font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                @if (savingModal()) {
                  <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                } @else {
                  <span>{{ editingId() ? 'Actualizar equipo' : 'Guardar equipo' }}</span>
                }
              </button>
            </div>
          </form>
        </app-modal>
      }
    </section>
  `
})
export class AdminFleetComponent {
  private readonly api = inject(ApiService);

  readonly loader = createLoader<Vehicle[]>(() => this.api.getVehicles(), []);

  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('ALL');
  readonly selectedStatus = signal<string>('ALL');

  readonly pageAlert = signal<string | null>(null);

  // Modal State
  readonly showModal = signal<boolean>(false);
  readonly editingId = signal<string | null>(null);
  readonly savingModal = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  formPlate = '';
  formBrand = '';
  formModel = '';
  formYear = 2024;
  formType = 0;
  formDailyRate = 0;
  formCapacity = '';
  formStatus = 0;

  readonly filteredVehicles = computed(() => {
    let list = this.loader.data();
    const query = this.searchQuery().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const typeFilter = this.selectedType();
    const statusFilter = this.selectedStatus();

    if (typeFilter !== 'ALL') {
      list = list.filter((v) => vehicleType(v).toLowerCase() === typeFilter.toLowerCase());
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((v) => {
        const badge = vehicleStatus(v);
        return badge.label.toLowerCase() === statusFilter.toLowerCase();
      });
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

  getBadge(v: Vehicle) {
    return vehicleStatus(v);
  }

  getType(v: Vehicle) {
    return vehicleType(v);
  }

  formatPrice(rate: number) {
    return cop(rate);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('ALL');
    this.selectedStatus.set('ALL');
  }

  openCreateModal(): void {
    this.editingId.set(null);
    this.formPlate = '';
    this.formBrand = '';
    this.formModel = '';
    this.formYear = new Date().getFullYear();
    this.formType = 0;
    this.formDailyRate = 0;
    this.formCapacity = '';
    this.formStatus = 0;
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEditModal(v: Vehicle): void {
    this.editingId.set(v.id);
    this.formPlate = v.plate;
    this.formBrand = v.brand;
    this.formModel = v.model;
    this.formYear = v.year;

    // Convertir el enum leído a número antes de enviarlo
    this.formType = num(v.type);
    this.formDailyRate = v.dailyRate;
    this.formCapacity = String(v.loadCapacity);
    this.formStatus = num(v.status);

    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSaveVehicle(): void {
    if (!this.formPlate || !this.formBrand || !this.formModel) {
      this.modalError.set('Por favor complete los campos obligatorios.');
      return;
    }

    const payload: VehicleInput = {
      plate: this.formPlate.trim().toUpperCase(),
      brand: this.formBrand.trim(),
      model: this.formModel.trim(),
      year: Number(this.formYear),
      type: Number(this.formType),
      dailyRate: Number(this.formDailyRate),
      loadCapacity: this.formCapacity.trim(),
      status: Number(this.formStatus),
      isActive: true
    };

    this.savingModal.set(true);
    this.modalError.set(null);

    const id = this.editingId();
    const req$ = id
      ? this.api.updateVehicle(id, payload)
      : this.api.createVehicle(payload);

    req$.subscribe({
      next: () => {
        this.savingModal.set(false);
        this.showModal.set(false);
        this.pageAlert.set(
          id
            ? 'Equipo actualizado correctamente en el sistema.'
            : 'Nuevo equipo o vehículo registrado exitosamente en la flota.'
        );
        this.loader.reload();
      },
      error: (err) => {
        this.savingModal.set(false);
        this.modalError.set(errMsg(err));
      }
    });
  }

  onDeleteVehicle(v: Vehicle): void {
    const confirmed = window.confirm(
      `¿Está seguro de eliminar el vehículo ${v.plate} (${v.brand} ${v.model})? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    this.pageAlert.set(null);

    this.api.deleteVehicle(v.id).subscribe({
      next: () => {
        this.pageAlert.set(`El equipo ${v.plate} fue retirado de la flota.`);
        this.loader.reload();
      },
      error: (err) => {
        this.pageAlert.set(errMsg(err));
      }
    });
  }
}
