import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '@components/alert.component';
import { PageHeaderComponent } from '@components/page-header.component';
import { ImportResult } from '@models/models';
import { ApiService } from '@services/api.service';
import { errMsg, saveBlob } from '@utils/util';

@Component({
  selector: 'app-admin-excel',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, AlertComponent],
  template: `
    <section class="flex flex-col gap-6">
      <app-page-header
        [title]="'Operaciones Masivas en Hoja de Cálculo'"
        [subtitle]="'Importación batch de catálogos y generación de reportes consolidados para gerencia'"
      />

      <app-alert [text]="pageAlert()" />

      <!-- Three Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 1. Import Materials Card -->
        <div class="bg-white institutional-border rounded-xl p-6 flex flex-col justify-between gap-6 shadow-sm">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-carbon text-[24px]">upload_file</span>
              <h3 class="font-title-md text-title-md text-carbon font-semibold">
                Importar materiales (.xlsx)
              </h3>
            </div>
            <p class="font-body-sm text-body-sm text-secondary-label">
              Archivo formato .xlsx únicamente, tamaño máx. 10 MB.
            </p>

            <!-- Drop Zone -->
            <label
              class="border-2 border-dashed border-[#DEDCD8] hover:border-carbon rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5 bg-warm-surface transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-secondary-label text-[28px]">cloud_upload</span>
              <span class="font-label-md text-label-md text-carbon font-semibold">
                {{ materialsFile ? materialsFile.name : 'Arrastre materiales.xlsx aquí' }}
              </span>
              <span class="font-label-sm text-label-sm text-secondary-label">
                o seleccione desde su equipo
              </span>
              <input
                type="file"
                accept=".xlsx"
                class="hidden"
                (change)="onMaterialsFileSelected($event)"
              />
            </label>

            <button
              type="button"
              [disabled]="processingMaterials() || !materialsFile"
              (click)="onProcessMaterials()"
              class="h-10 px-4 institutional-border rounded-xl font-label-md text-label-md text-carbon hover:bg-warm-surface font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              @if (processingMaterials()) {
                <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando archivo...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">sync</span>
                <span>Procesar materiales</span>
              }
            </button>
          </div>

          <!-- Materials Result Panel -->
          @if (materialsResult(); as res) {
            <div class="p-3.5 bg-warm-surface institutional-border rounded-xl flex flex-col gap-2">
              <div class="flex justify-between items-center text-label-sm font-semibold text-carbon">
                <span>Filas procesadas: {{ res.processed ?? 0 }}</span>
                <span [class]="(res.errors?.length || 0) > 0 ? 'text-error' : 'text-[#1E7B3A]'">
                  Filas con error: {{ res.errors?.length ?? 0 }}
                </span>
              </div>

              @if (res.errors && res.errors.length > 0) {
                <div class="overflow-x-auto text-[11px] max-h-40 overflow-y-auto">
                  <table class="w-full text-left border-collapse mt-1">
                    <thead class="bg-white border-b-institutional text-carbon font-semibold">
                      <tr>
                        <th class="p-1">Fila</th>
                        <th class="p-1">Dato</th>
                        <th class="p-1">Motivo del error</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#DEDCD8]">
                      @for (err of res.errors; track $index) {
                        <tr class="text-secondary-label">
                          <td class="p-1 font-mono text-carbon">#{{ err.row }}</td>
                          <td class="p-1 font-mono">{{ err.value || '-' }}</td>
                          <td class="p-1 text-error">{{ err.message }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </div>

        <!-- 2. Import Customers Card -->
        <div class="bg-white institutional-border rounded-xl p-6 flex flex-col justify-between gap-6 shadow-sm">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-carbon text-[24px]">contacts</span>
              <h3 class="font-title-md text-title-md text-carbon font-semibold">
                Importar clientes (.xlsx)
              </h3>
            </div>
            <p class="font-body-sm text-body-sm text-secondary-label">
              Archivo formato .xlsx únicamente, tamaño máx. 10 MB.
            </p>

            <label
              class="border-2 border-dashed border-[#DEDCD8] hover:border-carbon rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5 bg-warm-surface transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-secondary-label text-[28px]">folder_open</span>
              <span class="font-label-md text-label-md text-carbon font-semibold">
                {{ customersFile ? customersFile.name : 'Seleccionar clientes.xlsx' }}
              </span>
              <span class="font-label-sm text-label-sm text-secondary-label">
                Límite por lote: 5.000 filas
              </span>
              <input
                type="file"
                accept=".xlsx"
                class="hidden"
                (change)="onCustomersFileSelected($event)"
              />
            </label>

            <button
              type="button"
              [disabled]="processingCustomers() || !customersFile"
              (click)="onProcessCustomers()"
              class="h-10 px-4 institutional-border rounded-xl font-label-md text-label-md text-carbon hover:bg-warm-surface font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              @if (processingCustomers()) {
                <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando clientes...</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">sync</span>
                <span>Procesar clientes</span>
              }
            </button>
          </div>

          <!-- Customers Result Panel -->
          @if (customersResult(); as res) {
            <div class="p-3.5 bg-warm-surface institutional-border rounded-xl flex flex-col gap-2">
              <div class="flex justify-between items-center text-label-sm font-semibold text-carbon">
                <span>Filas procesadas: {{ res.processed ?? 0 }}</span>
                <span class="text-secondary-label">Creados: {{ res.created ?? 0 }}</span>
              </div>

              @if (res.errors && res.errors.length > 0) {
                <div class="overflow-x-auto text-[11px] max-h-40 overflow-y-auto">
                  <table class="w-full text-left border-collapse mt-1">
                    <thead class="bg-white border-b-institutional text-carbon font-semibold">
                      <tr>
                        <th class="p-1">Fila</th>
                        <th class="p-1">Motivo</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#DEDCD8]">
                      @for (err of res.errors; track $index) {
                        <tr class="text-secondary-label">
                          <td class="p-1 font-mono text-carbon">#{{ err.row }}</td>
                          <td class="p-1 text-error">{{ err.message }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </div>

        <!-- 3. Export Card -->
        <div class="bg-white institutional-border rounded-xl p-6 flex flex-col justify-between gap-6 shadow-sm">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-carbon text-[24px]">download</span>
              <h3 class="font-title-md text-title-md text-carbon font-semibold">
                Exportar a Excel (.xlsx)
              </h3>
            </div>
            <p class="font-body-sm text-body-sm text-secondary-label">
              Descargue sábanas consolidadas para Ventas, Productos y Clientes.
            </p>

            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-1.5">
                <label for="exportModule" class="font-label-sm text-label-sm text-carbon font-medium">
                  Módulo de exportación
                </label>
                <select
                  id="exportModule"
                  name="exportModule"
                  [(ngModel)]="selectedExportModule"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                >
                  <option value="sales">Ventas consolidadas (Octubre 2026)</option>
                  <option value="products">Productos / Inventario completo</option>
                  <option value="customers">Clientes y contratistas registrados</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-label-sm text-label-sm text-carbon font-medium">
                  Periodo contable
                </label>
                <input
                  type="text"
                  readonly
                  value="01/10/2026 al 31/10/2026"
                  class="h-10 px-3 bg-warm-surface institutional-border rounded-xl text-carbon text-body-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            [disabled]="exporting()"
            (click)="onExportModule()"
            class="w-full h-11 btn-primary-yellow font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            @if (exporting()) {
              <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
              <span>Generando libro Excel...</span>
            } @else {
              <span class="material-symbols-outlined text-[20px]">file_download</span>
              <span>Exportar reporte a Excel (.xlsx)</span>
            }
          </button>
        </div>
      </div>
    </section>
  `
})
export class AdminExcelComponent {
  private readonly api = inject(ApiService);

  materialsFile: File | null = null;
  customersFile: File | null = null;
  selectedExportModule = 'sales';

  readonly processingMaterials = signal<boolean>(false);
  readonly processingCustomers = signal<boolean>(false);
  readonly exporting = signal<boolean>(false);

  readonly materialsResult = signal<ImportResult | null>(null);
  readonly customersResult = signal<ImportResult | null>(null);
  readonly pageAlert = signal<string | null>(null);

  onMaterialsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.validateFile(file)) {
        this.materialsFile = file;
      }
    }
  }

  onCustomersFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.validateFile(file)) {
        this.customersFile = file;
      }
    }
  }

  private validateFile(file: File): boolean {
    this.pageAlert.set(null);
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.pageAlert.set('Formato no válido. Debe seleccionar un archivo con extensión .xlsx');
      return false;
    }
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      this.pageAlert.set('El archivo excede el tamaño máximo permitido de 10 MB.');
      return false;
    }
    return true;
  }

  onProcessMaterials(): void {
    if (!this.materialsFile) return;

    this.processingMaterials.set(true);
    this.materialsResult.set(null);
    this.pageAlert.set(null);

    this.api.importExcel('products', this.materialsFile).subscribe({
      next: (res) => {
        this.materialsResult.set(res);
        this.processingMaterials.set(false);
        this.pageAlert.set('Archivo de materiales procesado por el servidor.');
      },
      error: (err) => {
        this.processingMaterials.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }

  onProcessCustomers(): void {
    if (!this.customersFile) return;

    this.processingCustomers.set(true);
    this.customersResult.set(null);
    this.pageAlert.set(null);

    this.api.importExcel('customers', this.customersFile).subscribe({
      next: (res) => {
        this.customersResult.set(res);
        this.processingCustomers.set(false);
        this.pageAlert.set('Archivo de clientes procesado por el servidor.');
      },
      error: (err) => {
        this.processingCustomers.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }

  onExportModule(): void {
    this.exporting.set(true);
    this.pageAlert.set(null);

    this.api.exportExcel(this.selectedExportModule).subscribe({
      next: (blob) => {
        const modName =
          this.selectedExportModule === 'sales'
            ? 'Ventas'
            : this.selectedExportModule === 'products'
              ? 'Productos'
              : 'Clientes';
        saveBlob(blob, `${modName}-Firmeza-${new Date().toISOString().slice(0, 10)}.xlsx`);
        this.exporting.set(false);
        this.pageAlert.set(`Libro de ${modName} exportado con éxito.`);
      },
      error: (err) => {
        this.exporting.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }
}
