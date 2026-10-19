import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AlertComponent } from '@components/alert.component';
import { PageHeaderComponent } from '@components/page-header.component';
import { TableStateComponent } from '@components/table-state.component';
import { Customer, Sale } from '@models/models';
import { ApiService } from '@services/api.service';
import { cop } from '@utils/catalog';
import { saleStatus } from '@utils/admin';
import { errMsg, saveBlob } from '@utils/util';

@Component({
  selector: 'app-admin-sales',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TableStateComponent, AlertComponent],
  template: `
    <section class="flex flex-col gap-6">
      <app-page-header
        [title]="'Registro de Ventas'"
        [subtitle]="'Historial de transacciones de materiales, facturación y recibos de caja'"
      >
        <button
          type="button"
          [disabled]="exporting()"
          (click)="onExportSales()"
          class="h-11 px-5 btn-primary-yellow font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          @if (exporting()) {
            <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
            <span>Generando reporte...</span>
          } @else {
            <span class="material-symbols-outlined text-[20px]">file_download</span>
            <span>Descargar reporte consolidado</span>
          }
        </button>
      </app-page-header>

      <app-alert [text]="pageAlert()" />

      <!-- Date Range Filter Toolbar -->
      <div class="bg-white institutional-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div class="flex items-center gap-2">
            <label for="startDate" class="font-label-sm text-label-sm text-carbon font-medium">
              Desde:
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              [(ngModel)]="dateStart"
              class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
            />
          </div>

          <div class="flex items-center gap-2">
            <label for="endDate" class="font-label-sm text-label-sm text-carbon font-medium">
              Hasta:
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              [(ngModel)]="dateEnd"
              class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
            />
          </div>

          @if (dateStart || dateEnd) {
            <button
              type="button"
              (click)="clearDates()"
              class="text-label-sm text-secondary-label hover:text-carbon underline"
            >
              Limpiar fechas
            </button>
          }
        </div>

        <button
          type="button"
          (click)="loadData()"
          class="h-10 px-3 institutional-border rounded-xl font-body-sm text-secondary-label hover:text-carbon hover:bg-warm-surface flex items-center gap-1.5 self-end md:self-auto transition-colors"
          title="Recargar ventas"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- Sales Table -->
      <div class="bg-white institutional-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <app-table-state
          [loading]="loading()"
          [error]="error()"
          [empty]="filteredSales().length === 0"
          [emptyIcon]="'receipt_long'"
          [emptyTitle]="'Sin ventas registradas'"
          [emptyText]="'No se encontraron ventas en el periodo de fechas indicado.'"
          [resettable]="dateStart !== '' || dateEnd !== ''"
          (retry)="loadData()"
          (reset)="clearDates()"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-warm-surface border-b-institutional text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">N° de Venta</th>
                  <th class="py-3 px-6 font-semibold">Fecha y Hora</th>
                  <th class="py-3 px-6 font-semibold">Cliente Solicitante</th>
                  <th class="py-3 px-6 font-semibold">Subtotal</th>
                  <th class="py-3 px-6 font-semibold">IVA (19%)</th>
                  <th class="py-3 px-6 font-semibold">Total</th>
                  <th class="py-3 px-6 font-semibold">Estado</th>
                  <th class="py-3 px-6 font-semibold text-center">Recibo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (sale of filteredSales(); track sale.id) {
                  @let badge = getBadge(sale);
                  @let refNumber = getSaleNumber(sale);
                  @let clientName = getCustomerName(sale.customerId);

                  <tr class="hover:bg-[#FDFBF7]">
                    <td class="py-3.5 px-6 font-mono font-semibold text-carbon">
                      {{ refNumber }}
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label">
                      {{ formatDate(sale.createdAtUtc) }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-medium">
                      {{ clientName }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-medium">
                      {{ formatPrice(sale.subtotal) }}
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label">
                      {{ formatPrice(sale.tax) }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-bold">
                      {{ formatPrice(sale.total) }}
                    </td>
                    <td class="py-3.5 px-6">
                      <span class="badge-status {{ badge.cls }}">
                        {{ badge.label }}
                      </span>
                    </td>
                    <td class="py-3.5 px-6 text-center">
                      <button
                        type="button"
                        [disabled]="downloadingId() === sale.id"
                        (click)="onDownloadPdf(sale)"
                        class="px-2.5 py-1.5 institutional-border rounded-xl text-label-sm text-carbon hover:bg-warm-surface flex items-center justify-center gap-1 mx-auto transition-colors disabled:opacity-40"
                        title="Descargar recibo PDF"
                      >
                        @if (downloadingId() === sale.id) {
                          <div class="w-3.5 h-3.5 border border-carbon border-t-transparent rounded-full animate-spin"></div>
                        } @else {
                          <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                          <span>PDF</span>
                        }
                      </button>
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
export class AdminSalesComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly pageAlert = signal<string | null>(null);
  readonly exporting = signal<boolean>(false);
  readonly downloadingId = signal<string | null>(null);

  readonly sales = signal<Sale[]>([]);
  readonly customersMap = signal<Map<string, Customer>>(new Map());

  dateStart = '';
  dateEnd = '';

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      sales: this.api.getSales(),
      customers: this.api.getCustomers()
    }).subscribe({
      next: ({ sales, customers }) => {
        // Ordenar ventas por fecha descendente
        const sortedSales = [...sales].sort((a, b) => {
          const tA = new Date(a.createdAtUtc || 0).getTime();
          const tB = new Date(b.createdAtUtc || 0).getTime();
          return tB - tA;
        });

        const map = new Map<string, Customer>();
        customers.forEach((c) => map.set(c.id, c));

        this.sales.set(sortedSales);
        this.customersMap.set(map);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errMsg(err));
        this.loading.set(false);
      }
    });
  }

  readonly filteredSales = computed(() => {
    let list = this.sales();
    const start = this.dateStart ? new Date(this.dateStart) : null;
    const end = this.dateEnd ? new Date(this.dateEnd + 'T23:59:59') : null;

    if (start) {
      list = list.filter((s) => new Date(s.createdAtUtc) >= start);
    }
    if (end) {
      list = list.filter((s) => new Date(s.createdAtUtc) <= end);
    }

    return list;
  });

  getSaleNumber(s: Sale): string {
    if (s.saleNumber) return s.saleNumber;
    const year = s.createdAtUtc ? new Date(s.createdAtUtc).getFullYear() : 2026;
    const suffix = s.id ? s.id.substring(s.id.length - 4).toUpperCase() : '0000';
    return `VEN-${year}-${suffix}`;
  }

  getCustomerName(customerId: string): string {
    const c = this.customersMap().get(customerId);
    return c ? `${c.firstName} ${c.lastName}` : `Cliente [${customerId ? customerId.substring(0, 8) : 'Anónimo'}]`;
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      const date = new Date(d);
      return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return d;
    }
  }

  formatPrice(p: number) {
    return cop(p);
  }

  getBadge(s: Sale) {
    return saleStatus(s);
  }

  clearDates(): void {
    this.dateStart = '';
    this.dateEnd = '';
  }

  onExportSales(): void {
    this.exporting.set(true);
    this.pageAlert.set(null);

    this.api.exportExcel('sales').subscribe({
      next: (blob) => {
        saveBlob(blob, `Ventas-Consolidadas-Firmeza-${new Date().toISOString().slice(0, 10)}.xlsx`);
        this.exporting.set(false);
        this.pageAlert.set('Reporte consolidado de ventas descargado con éxito.');
      },
      error: (err) => {
        this.exporting.set(false);
        this.pageAlert.set(`Error al exportar ventas: ${errMsg(err)}`);
      }
    });
  }

  onDownloadPdf(s: Sale): void {
    this.downloadingId.set(s.id);
    this.pageAlert.set(null);

    this.api.downloadSalePdf(s.id).subscribe({
      next: (blob) => {
        saveBlob(blob, `Recibo-Venta-${this.getSaleNumber(s)}.pdf`);
        this.downloadingId.set(null);
      },
      error: (err) => {
        this.downloadingId.set(null);
        this.pageAlert.set(`Error al descargar recibo: ${errMsg(err)}`);
      }
    });
  }
}
