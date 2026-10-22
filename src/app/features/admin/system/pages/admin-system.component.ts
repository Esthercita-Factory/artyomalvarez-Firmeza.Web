import { Component, inject, signal } from '@angular/core';
import { AlertComponent } from '@components/alert.component';
import { PageHeaderComponent } from '@components/page-header.component';
import { ApiService } from '@services/api.service';
import { AuthService } from '@services/auth.service';
import { errMsg, saveBlob } from '@utils/util';

@Component({
  selector: 'app-admin-system',
  standalone: true,
  imports: [PageHeaderComponent, AlertComponent],
  template: `
    <section class="flex flex-col gap-6">
      <app-page-header
        [title]="'Configuración y Diagnóstico del Sistema'"
        [subtitle]="'Parámetros operacionales, estado de los servicios centrales y utilidades de respaldo'"
      />

      <app-alert [text]="pageAlert()" />

      @if (downloadSuccess()) {
        <div class="p-4 rounded-xl institutional-border bg-[#E8F5E9] text-[#1E7B3A] border-[#A5D6A7] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">check_circle</span>
            <span class="text-body-sm font-semibold">{{ downloadSuccess() }}</span>
          </div>
          <button type="button" (click)="downloadSuccess.set(null)" class="text-[#1E7B3A] hover:opacity-75">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      }

      <!-- System Health Diagnostics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Diagnostic Card 1: API & Runtime -->
        <div class="bg-white institutional-border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div class="flex items-center justify-between border-b border-[#DEDCD8] pb-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[24px] text-carbon">dns</span>
              <h2 class="font-headline-sm text-title-md text-carbon font-semibold">Backend API</h2>
            </div>
            <span class="badge-status status-disponible">Activo</span>
          </div>

          <div class="flex flex-col gap-2 font-body-sm text-body-sm">
            <div class="flex justify-between items-center text-secondary-label">
              <span>Framework:</span>
              <span class="font-mono font-semibold text-carbon">.NET 10 / ASP.NET Core</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Entorno:</span>
              <span class="font-semibold text-carbon">Desarrollo / Producción</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Protocolo:</span>
              <span class="font-mono text-carbon">REST JSON + JWT Bearer</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Seed Determinista:</span>
              <span class="text-[#1E7B3A] font-medium font-mono">Bogus Seed Activa</span>
            </div>
          </div>
        </div>

        <!-- Diagnostic Card 2: Database -->
        <div class="bg-white institutional-border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div class="flex items-center justify-between border-b border-[#DEDCD8] pb-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[24px] text-carbon">database</span>
              <h2 class="font-headline-sm text-title-md text-carbon font-semibold">Base de Datos</h2>
            </div>
            <span class="badge-status status-disponible">Conectado</span>
          </div>

          <div class="flex flex-col gap-2 font-body-sm text-body-sm">
            <div class="flex justify-between items-center text-secondary-label">
              <span>Motor:</span>
              <span class="font-semibold text-carbon">PostgreSQL 15</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Servicio en la nube:</span>
              <span class="font-mono font-semibold text-carbon">Supabase Pooler</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>ORM:</span>
              <span class="font-mono text-carbon">EF Core + Npgsql</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Zona Horaria Fechas:</span>
              <span class="font-mono text-carbon">UTC Normalizado</span>
            </div>
          </div>
        </div>

        <!-- Diagnostic Card 3: Security & Session -->
        <div class="bg-white institutional-border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div class="flex items-center justify-between border-b border-[#DEDCD8] pb-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[24px] text-carbon">verified_user</span>
              <h2 class="font-headline-sm text-title-md text-carbon font-semibold">Sesión Actual</h2>
            </div>
            <span class="badge-status status-disponible">Autenticado</span>
          </div>

          <div class="flex flex-col gap-2 font-body-sm text-body-sm">
            <div class="flex justify-between items-center text-secondary-label">
              <span>Usuario:</span>
              <span class="font-mono font-semibold text-carbon">{{ auth.email() || 'admin@firmeza.com' }}</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Rol Autorizado:</span>
              <span class="badge-status status-activo">{{ roleDisplay() }}</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Token:</span>
              <span class="font-mono text-carbon">JWT Válido</span>
            </div>
            <div class="flex justify-between items-center text-secondary-label">
              <span>Protección:</span>
              <span class="text-[#1E7B3A] font-medium">adminGuard Activo</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Export & Backup Section -->
      <div class="bg-white institutional-border rounded-xl p-6 flex flex-col gap-5 shadow-sm">
        <div>
          <h2 class="font-headline-sm text-headline-sm text-carbon font-semibold">
            Descarga de Reportes Institucionales y Respaldos
          </h2>
          <p class="font-body-sm text-body-sm text-secondary-label">
            Genere y descargue copias consolidadas del catálogo de productos, clientes y transacciones contables.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <!-- Button 1: Products PDF -->
          <button
            type="button"
            [disabled]="loadingProductsPdf()"
            (click)="onDownloadProductsPdf()"
            class="p-4 border border-[#DEDCD8] rounded-xl hover:bg-warm-surface flex flex-col items-center justify-center gap-3 text-center transition-colors disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[32px] text-carbon">picture_as_pdf</span>
            <div class="flex flex-col">
              <span class="font-semibold text-carbon text-body-sm">Catálogo en PDF</span>
              <span class="text-[12px] text-secondary-label">Lista oficial de precios y stock</span>
            </div>
          </button>

          <!-- Button 2: Customers PDF -->
          <button
            type="button"
            [disabled]="loadingCustomersPdf()"
            (click)="onDownloadCustomersPdf()"
            class="p-4 border border-[#DEDCD8] rounded-xl hover:bg-warm-surface flex flex-col items-center justify-center gap-3 text-center transition-colors disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[32px] text-carbon">badge</span>
            <div class="flex flex-col">
              <span class="font-semibold text-carbon text-body-sm">Directorio Clientes PDF</span>
              <span class="text-[12px] text-secondary-label">Listado de clientes corporativos</span>
            </div>
          </button>

          <!-- Button 3: Sales Excel -->
          <button
            type="button"
            [disabled]="loadingSalesExcel()"
            (click)="onExportSalesExcel()"
            class="p-4 border border-[#DEDCD8] rounded-xl hover:bg-warm-surface flex flex-col items-center justify-center gap-3 text-center transition-colors disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[32px] text-[#1E7B3A]">table_view</span>
            <div class="flex flex-col">
              <span class="font-semibold text-carbon text-body-sm">Ventas en Excel (.xlsx)</span>
              <span class="text-[12px] text-secondary-label">Consolidado contable de ventas</span>
            </div>
          </button>

          <!-- Button 4: Products Excel -->
          <button
            type="button"
            [disabled]="loadingProductsExcel()"
            (click)="onExportProductsExcel()"
            class="p-4 border border-[#DEDCD8] rounded-xl hover:bg-warm-surface flex flex-col items-center justify-center gap-3 text-center transition-colors disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[32px] text-[#0B5CAD]">inventory_2</span>
            <div class="flex flex-col">
              <span class="font-semibold text-carbon text-body-sm">Inventario en Excel (.xlsx)</span>
              <span class="text-[12px] text-secondary-label">Matriz de existencias y SKU</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  `
})
export class AdminSystemComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly pageAlert = signal<string | null>(null);
  readonly downloadSuccess = signal<string | null>(null);

  readonly loadingProductsPdf = signal<boolean>(false);
  readonly loadingCustomersPdf = signal<boolean>(false);
  readonly loadingSalesExcel = signal<boolean>(false);
  readonly loadingProductsExcel = signal<boolean>(false);

  roleDisplay(): string {
    const r = this.auth.role();
    if (!r) return 'Administrador Central';
    if (Array.isArray(r)) return r.join(', ');
    return String(r);
  }

  onDownloadProductsPdf(): void {
    this.loadingProductsPdf.set(true);
    this.pageAlert.set(null);
    this.api.downloadProductsPdf().subscribe({
      next: (blob) => {
        this.loadingProductsPdf.set(false);
        saveBlob(blob, 'catalogo-materiales-firmeza.pdf');
        this.downloadSuccess.set('Catálogo de materiales descargado con éxito.');
      },
      error: (err) => {
        this.loadingProductsPdf.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }

  onDownloadCustomersPdf(): void {
    this.loadingCustomersPdf.set(true);
    this.pageAlert.set(null);
    this.api.downloadCustomersPdf().subscribe({
      next: (blob) => {
        this.loadingCustomersPdf.set(false);
        saveBlob(blob, 'directorio-clientes-firmeza.pdf');
        this.downloadSuccess.set('Directorio de clientes descargado con éxito.');
      },
      error: (err) => {
        this.loadingCustomersPdf.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }

  onExportSalesExcel(): void {
    this.loadingSalesExcel.set(true);
    this.pageAlert.set(null);
    this.api.exportExcel('sales').subscribe({
      next: (blob) => {
        this.loadingSalesExcel.set(false);
        saveBlob(blob, 'ventas-firmeza.xlsx');
        this.downloadSuccess.set('Reporte de ventas en Excel descargado con éxito.');
      },
      error: (err) => {
        this.loadingSalesExcel.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }

  onExportProductsExcel(): void {
    this.loadingProductsExcel.set(true);
    this.pageAlert.set(null);
    this.api.exportExcel('products').subscribe({
      next: (blob) => {
        this.loadingProductsExcel.set(false);
        saveBlob(blob, 'inventario-firmeza.xlsx');
        this.downloadSuccess.set('Inventario de materiales en Excel descargado con éxito.');
      },
      error: (err) => {
        this.loadingProductsExcel.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }
}
