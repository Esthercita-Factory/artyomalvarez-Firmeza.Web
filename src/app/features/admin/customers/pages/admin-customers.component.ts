import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '@components/alert.component';
import { PageHeaderComponent } from '@components/page-header.component';
import { TableStateComponent } from '@components/table-state.component';
import { Customer } from '@models/models';
import { ApiService } from '@services/api.service';
import { createLoader, errMsg, saveBlob } from '@utils/util';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TableStateComponent, AlertComponent],
  template: `
    <section class="flex flex-col gap-6">
      <app-page-header
        [title]="'Directorio de Clientes'"
        [subtitle]="'Base de datos corporativa de contratistas, constructoras y compradores registrados'"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            [disabled]="exportingPdf()"
            (click)="onExportPdfCustomers()"
            class="h-11 px-4 institutional-border rounded-xl font-label-md text-label-md text-carbon hover:bg-warm-surface flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            title="Descargar directorio en PDF"
          >
            @if (exportingPdf()) {
              <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
              <span>Generando PDF...</span>
            } @else {
              <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              <span>Exportar PDF</span>
            }
          </button>
          <button
            type="button"
            [disabled]="exporting()"
            (click)="onExportCustomers()"
            class="h-11 px-5 btn-primary-yellow font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            @if (exporting()) {
              <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
              <span>Generando Excel...</span>
            } @else {
              <span class="material-symbols-outlined text-[20px]">file_download</span>
              <span>Exportar Excel</span>
            }
          </button>
        </div>
      </app-page-header>

      <app-alert [text]="pageAlert()" />

      <!-- Search Toolbar -->
      <div class="bg-white institutional-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div class="relative w-full sm:max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-2.5 text-secondary-label text-[20px]">
            search
          </span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por documento, nombre o correo..."
            class="w-full h-10 pl-9 pr-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
          />
        </div>

        <button
          type="button"
          (click)="loader.reload()"
          class="h-10 px-3 institutional-border rounded-xl font-body-sm text-secondary-label hover:text-carbon hover:bg-warm-surface flex items-center gap-1.5 self-end sm:self-auto transition-colors"
          title="Recargar directorio"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- Customers Table -->
      <div class="bg-white institutional-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <app-table-state
          [loading]="loader.loading()"
          [error]="loader.error()"
          [empty]="filteredCustomers().length === 0"
          [emptyIcon]="'group_off'"
          [emptyTitle]="'Sin clientes registrados'"
          [emptyText]="'No se encontraron clientes que coincidan con la búsqueda.'"
          [resettable]="searchQuery() !== ''"
          (retry)="loader.reload()"
          (reset)="searchQuery.set('')"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-warm-surface border-b-institutional text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">Documento de Identidad</th>
                  <th class="py-3 px-6 font-semibold">Nombre Completo</th>
                  <th class="py-3 px-6 font-semibold">Correo Electrónico</th>
                  <th class="py-3 px-6 font-semibold">Teléfono de Contacto</th>
                  <th class="py-3 px-6 font-semibold">Dirección</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (c of filteredCustomers(); track c.id) {
                  <tr class="hover:bg-[#FDFBF7]">
                    <td class="py-3.5 px-6 font-mono font-medium text-carbon">
                      {{ c.documentType }} {{ c.documentNumber }}
                    </td>
                    <td class="py-3.5 px-6 font-semibold text-carbon">
                      {{ c.firstName }} {{ c.lastName }}
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label">
                      {{ c.email }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-medium">
                      {{ c.phone || 'No registrado' }}
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label">
                      {{ c.address || 'Principal' }}
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
export class AdminCustomersComponent {
  private readonly api = inject(ApiService);

  readonly loader = createLoader<Customer[]>(() => this.api.getCustomers(), []);

  readonly searchQuery = signal<string>('');
  readonly pageAlert = signal<string | null>(null);
  readonly exporting = signal<boolean>(false);
  readonly exportingPdf = signal<boolean>(false);

  readonly filteredCustomers = computed(() => {
    let list = this.loader.data();
    const query = this.searchQuery().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (query) {
      list = list.filter((c) => {
        const doc = (c.documentNumber || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const fn = (c.firstName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const ln = (c.lastName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const em = (c.email || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return doc.includes(query) || fn.includes(query) || ln.includes(query) || em.includes(query);
      });
    }

    return list;
  });

  onExportCustomers(): void {
    this.exporting.set(true);
    this.pageAlert.set(null);

    this.api.exportExcel('customers').subscribe({
      next: (blob) => {
        saveBlob(blob, `Clientes-Firmeza-${new Date().toISOString().slice(0, 10)}.xlsx`);
        this.exporting.set(false);
        this.pageAlert.set('Directorio de clientes exportado con éxito.');
      },
      error: (err) => {
        this.exporting.set(false);
        this.pageAlert.set(`Error al exportar clientes: ${errMsg(err)}`);
      }
    });
  }

  onExportPdfCustomers(): void {
    this.exportingPdf.set(true);
    this.pageAlert.set(null);

    this.api.downloadCustomersPdf().subscribe({
      next: (blob) => {
        this.exportingPdf.set(false);
        saveBlob(blob, `Directorio-Clientes-Firmeza-${new Date().toISOString().slice(0, 10)}.pdf`);
        this.pageAlert.set('Directorio de clientes en PDF exportado con éxito.');
      },
      error: (err) => {
        this.exportingPdf.set(false);
        this.pageAlert.set(`Error al exportar clientes en PDF: ${errMsg(err)}`);
      }
    });
  }
}
