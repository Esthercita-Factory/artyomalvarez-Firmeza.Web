import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '@components/alert.component';
import { ModalComponent } from '@components/modal.component';
import { PageHeaderComponent } from '@components/page-header.component';
import { TableStateComponent } from '@components/table-state.component';
import { Product, ProductInput } from '@models/models';
import { ApiService } from '@services/api.service';
import { StockAlertsService } from '@services/stock-alerts.service';
import { categoryOf, cop } from '@utils/catalog';
import { errMsg } from '@utils/util';

@Component({
  selector: 'app-admin-stock-alerts',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TableStateComponent, AlertComponent, ModalComponent],
  template: `
    <section class="flex flex-col gap-6">
      <app-page-header
        [title]="'Alertas de Stock Mínimo'"
        [subtitle]="'Monitoreo prioritario de materiales por debajo o al límite del umbral de seguridad en bodega central'"
      >
        <button
          type="button"
          (click)="stockAlerts.refresh()"
          class="h-11 px-5 institutional-border rounded-xl font-label-md text-carbon hover:bg-warm-surface flex items-center justify-center gap-2 transition-colors"
          title="Recargar alertas de stock"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          <span>Actualizar Alertas</span>
        </button>
      </app-page-header>

      <app-alert [text]="pageAlert()" />

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <span class="font-label-sm text-label-sm text-secondary-label">Total Referencias en Alerta</span>
          <span class="font-headline-lg text-headline-md font-bold text-carbon">
            {{ stockAlerts.lowStockCount() }}
          </span>
          <span class="text-[12px] text-secondary-label">Existencias menores o iguales al mínimo</span>
        </div>

        <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <span class="font-label-sm text-label-sm text-secondary-label">Referencias Agotadas</span>
          <span class="font-headline-lg text-headline-md font-bold text-[#B3261E]">
            {{ outOfStockCount() }}
          </span>
          <span class="text-[12px] text-secondary-label">Inventario en cero (bloqueado para venta)</span>
        </div>

        <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <span class="font-label-sm text-label-sm text-secondary-label">Unidades Sugeridas de Reabastecimiento</span>
          <span class="font-headline-lg text-headline-md font-bold text-[#B45F06]">
            {{ totalSuggestedReplenish() }}
          </span>
          <span class="text-[12px] text-secondary-label">Para restaurar el colchón de seguridad (+10u)</span>
        </div>
      </div>

      <!-- Search Filter Bar -->
      <div class="bg-white institutional-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div class="relative w-full sm:w-80">
          <span class="material-symbols-outlined absolute left-3 top-2.5 text-secondary-label text-[18px]">
            search
          </span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por SKU, nombre o marca..."
            class="w-full h-10 pl-9 pr-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
          />
        </div>

        <div class="text-[12px] text-secondary-label">
          Regla única institucional: <strong class="font-mono text-carbon">Stock &le; Stock Mínimo</strong>
        </div>
      </div>

      <!-- Table Section -->
      <div class="bg-white institutional-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <app-table-state
          [loading]="stockAlerts.loading()"
          [error]="stockAlerts.error()"
          [empty]="filteredAlerts().length === 0"
          [emptyIcon]="'check_circle'"
          [emptyTitle]="'Sin alertas de stock bajo'"
          [emptyText]="'Todos los materiales cumplen satisfactoriamente con el umbral mínimo operativo en bodega central.'"
          (retry)="stockAlerts.refresh()"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-warm-surface border-b-institutional text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">SKU</th>
                  <th class="py-3 px-6 font-semibold">Material / Marca</th>
                  <th class="py-3 px-6 font-semibold">Categoría</th>
                  <th class="py-3 px-6 font-semibold">Stock Actual</th>
                  <th class="py-3 px-6 font-semibold">Stock Mínimo</th>
                  <th class="py-3 px-6 font-semibold">Faltante Sugerido</th>
                  <th class="py-3 px-6 font-semibold">Severidad</th>
                  <th class="py-3 px-6 font-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (prod of filteredAlerts(); track prod.id) {
                  @let cat = getCategory(prod.sku, prod.category);
                  @let faltante = getSuggestedReplenish(prod);

                  <tr class="hover:bg-[#FDFBF7]">
                    <td class="py-3.5 px-6 font-semibold text-carbon font-mono">
                      {{ prod.sku }}
                    </td>

                    <td class="py-3.5 px-6 text-carbon">
                      <div class="flex flex-col">
                        <span class="font-medium">{{ prod.name }}</span>
                        <span class="text-secondary-label text-[12px]">Marca: {{ prod.brand }}</span>
                      </div>
                    </td>

                    <td class="py-3.5 px-6 text-secondary-label">
                      <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px]">{{ cat.icon }}</span>
                        <span>{{ cat.name }}</span>
                      </div>
                    </td>

                    <td class="py-3.5 px-6 font-bold" [class]="prod.stock <= 0 ? 'text-[#B3261E]' : 'text-[#B45F06]'">
                      {{ prod.stock }} {{ prod.unitPrice ? 'unidades' : '' }}
                    </td>

                    <td class="py-3.5 px-6 text-secondary-label font-medium">
                      {{ prod.minimumStock }} unidades
                    </td>

                    <td class="py-3.5 px-6 font-mono font-semibold text-carbon">
                      +{{ faltante }} unidades
                    </td>

                    <td class="py-3.5 px-6">
                      @if (prod.stock <= 0) {
                        <span class="badge-status status-agotado">Agotado Crítico</span>
                      } @else {
                        <span class="badge-status status-alerta">Pocas Unidades</span>
                      }
                    </td>

                    <td class="py-3.5 px-6 text-center">
                      <button
                        type="button"
                        (click)="openAdjustModal(prod)"
                        class="h-8 px-3 btn-primary-yellow text-label-sm font-semibold rounded-lg flex items-center gap-1 mx-auto"
                        title="Reabastecer stock de este material"
                      >
                        <span class="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                        <span>Reabastecer</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-table-state>
      </div>

      <!-- Quick Replenish Modal -->
      @if (showModal()) {
        <app-modal
          [title]="'Reabastecimiento de Inventario: ' + activeProduct()?.name"
          (close)="closeModal()"
        >
          <div class="flex flex-col gap-4">
            <div class="p-3 bg-warm-surface institutional-border rounded-xl flex items-center justify-between text-body-sm">
              <span class="text-secondary-label">SKU: <strong class="text-carbon font-mono">{{ activeProduct()?.sku }}</strong></span>
              <span class="text-secondary-label">Stock Actual: <strong class="text-carbon">{{ activeProduct()?.stock }} u</strong></span>
              <span class="text-secondary-label">Stock Mínimo: <strong class="text-carbon">{{ activeProduct()?.minimumStock }} u</strong></span>
            </div>

            @if (modalError()) {
              <div class="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded text-[#B3261E] text-body-sm">
                {{ modalError() }}
              </div>
            }

            <div class="flex flex-col gap-1.5">
              <label for="unitsToAdd" class="font-label-sm text-label-sm text-carbon font-medium">
                Unidades a ingresar a bodega *
              </label>
              <input
                id="unitsToAdd"
                name="unitsToAdd"
                type="number"
                min="1"
                [(ngModel)]="unitsToAdd"
                class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                placeholder="Ej. 50"
              />
              <span class="text-[11px] text-secondary-label">
                Nuevo stock proyectado: <strong>{{ (activeProduct()?.stock || 0) + (unitsToAdd || 0) }}</strong> unidades
              </span>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t-institutional mt-2">
              <button
                type="button"
                (click)="closeModal()"
                class="h-10 px-4 institutional-border rounded-xl font-label-md text-carbon hover:bg-warm-surface"
              >
                Cancelar
              </button>

              <button
                type="button"
                [disabled]="saving() || unitsToAdd <= 0"
                (click)="onConfirmReplenish()"
                class="h-10 px-5 btn-primary-yellow font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                @if (saving()) {
                  <div class="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                } @else {
                  <span class="material-symbols-outlined text-[18px]">check</span>
                  <span>Confirmar Ingreso</span>
                }
              </button>
            </div>
          </div>
        </app-modal>
      }
    </section>
  `
})
export class AdminStockAlertsComponent {
  private readonly api = inject(ApiService);
  readonly stockAlerts = inject(StockAlertsService);

  readonly searchQuery = signal<string>('');
  readonly pageAlert = signal<string | null>(null);

  // Modal rápido de reabastecimiento
  readonly showModal = signal<boolean>(false);
  readonly activeProduct = signal<Product | null>(null);
  readonly saving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);
  unitsToAdd = 10;

  readonly outOfStockCount = computed(() => {
    return this.stockAlerts.lowStockItems().filter((p) => p.stock <= 0).length;
  });

  readonly totalSuggestedReplenish = computed(() => {
    return this.stockAlerts.lowStockItems().reduce((acc, p) => acc + this.getSuggestedReplenish(p), 0);
  });

  readonly filteredAlerts = computed(() => {
    const list = this.stockAlerts.lowStockItems();
    const q = this.searchQuery().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!q) return list;

    return list.filter((p) => {
      const s = (p.sku || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const n = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const b = (p.brand || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return s.includes(q) || n.includes(q) || b.includes(q);
    });
  });

  getCategory(sku: string, category?: string) {
    return categoryOf(sku, category);
  }

  getSuggestedReplenish(p: Product): number {
    const deficit = Math.max(0, p.minimumStock - p.stock);
    // Reposición sugerida para superar el mínimo con margen de seguridad
    return deficit + 10;
  }

  openAdjustModal(p: Product): void {
    this.activeProduct.set(p);
    this.unitsToAdd = this.getSuggestedReplenish(p);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.activeProduct.set(null);
  }

  onConfirmReplenish(): void {
    const p = this.activeProduct();
    if (!p) return;

    if (this.unitsToAdd <= 0) {
      this.modalError.set('La cantidad a ingresar debe ser mayor a 0.');
      return;
    }

    this.saving.set(true);
    this.modalError.set(null);

    const newStock = Number(p.stock) + Number(this.unitsToAdd);
    const payload: ProductInput = {
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      category: p.category || categoryOf(p.sku).name || 'General',
      unitPrice: p.unitPrice,
      stock: newStock,
      minimumStock: p.minimumStock
    };

    this.api.updateProduct(p.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.pageAlert.set(`Se ingresaron correctamente ${this.unitsToAdd} unidades al material ${p.sku}.`);
        // Refresco inmediato en el servicio central
        this.stockAlerts.refresh();
      },
      error: (err) => {
        this.saving.set(false);
        this.modalError.set(errMsg(err));
      }
    });
  }
}
