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
import { stockBadge } from '@utils/admin';
import { createLoader, errMsg, saveBlob } from '@utils/util';

@Component({
  selector: 'app-admin-materials',
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
      <!-- Toolbar Header -->
      <app-page-header
        [title]="'Gestión de Materiales'"
        [subtitle]="'Control de existencias, referencias técnicas y catálogo comercial'"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            [disabled]="exportingPdf()"
            (click)="onExportPdf()"
            class="h-11 px-4 institutional-border rounded-xl font-label-md text-label-md text-carbon hover:bg-warm-surface flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            title="Descargar catálogo en PDF"
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
            (click)="openCreateModal()"
            class="h-11 px-5 btn-primary-yellow font-semibold flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[20px]">add</span>
            <span>+ Nuevo material</span>
          </button>
        </div>
      </app-page-header>

      <app-alert [text]="pageAlert()" />

      <!-- Filters Row -->
      <div class="bg-white institutional-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <!-- Campo de búsqueda rediseñado -->
          <div class="relative w-full sm:w-auto min-w-[280px] flex-1">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-label text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Buscar por SKU, nombre, marca o categoría..."
              class="w-full h-11 pl-11 pr-10 bg-white border border-[#DEDCD8] rounded-xl text-carbon text-body-sm focus:border-[#FDDA24] focus:ring-1 focus:ring-[#FDDA24] focus:outline-none transition-all placeholder:text-secondary-label/70"
            />
            @if (searchQuery()) {
              <button
                type="button"
                (click)="clearSearch()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-label hover:text-carbon p-1 rounded-full flex items-center justify-center transition-colors"
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
              >
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>
            }
          </div>

          <select
            [ngModel]="selectedCategory()"
            (ngModelChange)="selectedCategory.set($event)"
            class="h-11 px-3.5 bg-white border border-[#DEDCD8] rounded-xl text-carbon text-body-sm focus:border-[#FDDA24] focus:ring-1 focus:ring-[#FDDA24] focus:outline-none transition-all w-full sm:w-auto"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="CEM">Cementos y morteros</option>
            <option value="AGR">Agregados (arena, grava)</option>
            <option value="LAD">Ladrillos y bloques</option>
            <option value="HIE">Hierro y acero</option>
            <option value="PIN">Pinturas</option>
            <option value="HER">Herramientas</option>
            <option value="ELE">Eléctricos</option>
            <option value="PLO">Plomería</option>
            <option value="Otros">Otras categorías</option>
          </select>

          <select
            [ngModel]="selectedStatus()"
            (ngModelChange)="selectedStatus.set($event)"
            class="h-11 px-3.5 bg-white border border-[#DEDCD8] rounded-xl text-carbon text-body-sm focus:border-[#FDDA24] focus:ring-1 focus:ring-[#FDDA24] focus:outline-none transition-all w-full sm:w-auto"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Disponible">Disponible (Stock normal)</option>
            <option value="Stock bajo">Stock bajo (Mínimo o menos)</option>
            <option value="Pocas unidades">Pocas unidades (1 al mínimo)</option>
            <option value="Agotado">Agotado (0 unidades)</option>
          </select>
        </div>

        <button
          type="button"
          (click)="loader.reload()"
          class="h-11 px-4 border border-[#DEDCD8] rounded-xl font-body-sm text-secondary-label hover:text-carbon hover:bg-warm-surface flex items-center gap-1.5 self-end lg:self-auto transition-colors"
          title="Recargar catálogo"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- Materials Table -->
      <div class="bg-white institutional-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <app-table-state
          [loading]="loader.loading()"
          [error]="loader.error()"
          [empty]="filteredProducts().length === 0"
          [emptyIcon]="'inventory_2'"
          [emptyTitle]="'Sin materiales registrados'"
          [emptyText]="'No se encontraron materiales que coincidan con los criterios de búsqueda.'"
          [resettable]="searchQuery() !== '' || selectedCategory() !== 'ALL' || selectedStatus() !== 'ALL'"
          (retry)="loader.reload()"
          (reset)="resetFilters()"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-warm-surface border-b-institutional text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">SKU</th>
                  <th class="py-3 px-6 font-semibold">Nombre y Marca</th>
                  <th class="py-3 px-6 font-semibold">Categoría</th>
                  <th class="py-3 px-6 font-semibold">Precio Unit.</th>
                  <th class="py-3 px-6 font-semibold">Stock</th>
                  <th class="py-3 px-6 font-semibold">Estado</th>
                  <th class="py-3 px-6 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (prod of filteredProducts(); track prod.id) {
                  @let badge = getBadge(prod);
                  @let cat = getCategory(prod.sku, prod.category);

                  <tr class="hover:bg-[#FDFBF7]">
                    <td class="py-3.5 px-6 font-semibold text-carbon font-mono">
                      {{ prod.sku }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon">
                      <span class="font-medium">{{ prod.name }}</span>
                      <span class="text-secondary-label ml-1.5 text-[12px] font-normal">({{ prod.brand }})</span>
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label flex items-center gap-1.5 mt-2 sm:mt-0">
                      <span class="material-symbols-outlined text-[16px] text-secondary-label">{{ cat.icon }}</span>
                      <span>{{ cat.name }}</span>
                    </td>
                    <td class="py-3.5 px-6 font-medium text-carbon">
                      {{ formatPrice(prod.unitPrice) }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon font-medium">
                      {{ prod.stock }}
                      <span class="text-[11px] text-secondary-label font-normal">/ mín {{ prod.minimumStock }}</span>
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
                          (click)="openEditModal(prod)"
                          class="p-1.5 text-secondary-label hover:text-carbon rounded transition-colors"
                          title="Editar material"
                          aria-label="Editar"
                        >
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          (click)="onDeleteProduct(prod)"
                          class="p-1.5 text-secondary-label hover:text-error rounded transition-colors"
                          title="Eliminar material"
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
          [title]="editingId() ? 'Editar Material' : 'Registrar Nuevo Material'"
          [icon]="editingId() ? 'edit_note' : 'add_box'"
          (close)="closeModal()"
        >
          <app-alert [text]="modalError()" />

          <form class="flex flex-col gap-4" (ngSubmit)="onSaveProduct()">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="sku" class="font-label-sm text-label-sm text-carbon font-medium">
                  Código SKU *
                </label>
                <input
                  id="sku"
                  name="sku"
                  type="text"
                  required
                  [(ngModel)]="formSku"
                  placeholder="p.ej. CEM-050"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="brand" class="font-label-sm text-label-sm text-carbon font-medium">
                  Marca Comercial *
                </label>
                <input
                  id="brand"
                  name="brand"
                  type="text"
                  required
                  [(ngModel)]="formBrand"
                  placeholder="p.ej. Argos / Diaco / Corona"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="name" class="font-label-sm text-label-sm text-carbon font-medium">
                  Nombre del Material *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  [(ngModel)]="formName"
                  placeholder="p.ej. Cemento Gris de Uso General 50 kg"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="category" class="font-label-sm text-label-sm text-carbon font-medium">
                  Categoría del Material *
                </label>
                <select
                  id="category"
                  name="category"
                  [(ngModel)]="formCategory"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                >
                  <option value="Cementos y morteros">Cementos y morteros</option>
                  <option value="Agregados (arena, grava)">Agregados (arena, grava)</option>
                  <option value="Ladrillos y bloques">Ladrillos y bloques</option>
                  <option value="Hierro y acero">Hierro y acero</option>
                  <option value="Pinturas">Pinturas</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Eléctricos">Eléctricos</option>
                  <option value="Plomería">Plomería</option>
                  <option value="General">General / Otros</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="unitPrice" class="font-label-sm text-label-sm text-carbon font-medium">
                  Precio Unitario ($ COP) *
                </label>
                <input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="100"
                  required
                  [(ngModel)]="formPrice"
                  placeholder="32500"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="stock" class="font-label-sm text-label-sm text-carbon font-medium">
                  Stock Inicial *
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  required
                  [(ngModel)]="formStock"
                  placeholder="100"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="minimumStock" class="font-label-sm text-label-sm text-carbon font-medium">
                  Stock Mínimo *
                </label>
                <input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  min="0"
                  required
                  [(ngModel)]="formMinimumStock"
                  placeholder="20"
                  class="h-10 px-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
                />
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
                  <span>{{ editingId() ? 'Actualizar material' : 'Guardar material' }}</span>
                }
              </button>
            </div>
          </form>
        </app-modal>
      }
    </section>
  `
})
export class AdminMaterialsComponent {
  private readonly api = inject(ApiService);
  readonly stockAlerts = inject(StockAlertsService);

  readonly loader = createLoader<Product[]>(() => this.api.getProducts(), []);

  readonly searchQuery = signal<string>('');
  readonly debouncedSearch = signal<string>('');
  readonly selectedCategory = signal<string>('ALL');
  readonly selectedStatus = signal<string>('ALL');

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  readonly pageAlert = signal<string | null>(null);
  readonly exportingPdf = signal<boolean>(false);

  // Modal State
  readonly showModal = signal<boolean>(false);
  readonly editingId = signal<string | null>(null);
  readonly savingModal = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  formSku = '';
  formBrand = '';
  formName = '';
  formCategory = 'General';
  formPrice = 0;
  formStock = 0;
  formMinimumStock = 0;

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.debouncedSearch.set(val);
    }, 300);
  }

  readonly filteredProducts = computed(() => {
    let list = this.loader.data();
    const query = this.debouncedSearch().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cat = this.selectedCategory();
    const status = this.selectedStatus();

    if (cat !== 'ALL') {
      if (cat === 'Otros') {
        list = list.filter((p) => {
          const info = categoryOf(p.sku, p.category);
          return info.name === 'Otros';
        });
      } else {
        list = list.filter((p) => {
          const pref = (p.sku || '').toUpperCase().substring(0, 3);
          const info = categoryOf(p.sku, p.category);
          if (cat === 'CEM') return pref === 'CEM' || info.name.toLowerCase().includes('cemento');
          if (cat === 'AGR') return pref === 'AGR' || info.name.toLowerCase().includes('agregado');
          if (cat === 'LAD') return pref === 'LAD' || pref === 'MAM' || info.name.toLowerCase().includes('ladrillo');
          if (cat === 'HIE') return pref === 'HIE' || pref === 'ACE' || info.name.toLowerCase().includes('acero') || info.name.toLowerCase().includes('hierro');
          if (cat === 'PIN') return pref === 'PIN' || info.name.toLowerCase().includes('pintura');
          if (cat === 'HER') return pref === 'HER' || info.name.toLowerCase().includes('herramienta');
          if (cat === 'ELE') return pref === 'ELE' || info.name.toLowerCase().includes('electrico');
          if (cat === 'PLO') return pref === 'PLO' || info.name.toLowerCase().includes('plomeria');
          return pref.startsWith(cat) || info.name.toLowerCase().includes(cat.toLowerCase());
        });
      }
    }

    if (status !== 'ALL') {
      list = list.filter((p) => {
        const st = status.toLowerCase();
        if (st.includes('bajo')) {
          return p.stock <= p.minimumStock;
        }
        if (st.includes('agotado')) {
          return p.stock <= 0;
        }
        if (st.includes('pocas')) {
          return p.stock > 0 && p.stock <= p.minimumStock;
        }
        if (st.includes('disponible')) {
          return p.stock > p.minimumStock;
        }
        const badge = stockBadge(p);
        return badge.label.toLowerCase() === st;
      });
    }

    if (query) {
      list = list.filter((p) => {
        const s = (p.sku || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const n = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const b = (p.brand || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const c = (p.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const catInfo = categoryOf(p.sku, p.category).name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return s.includes(query) || n.includes(query) || b.includes(query) || c.includes(query) || catInfo.includes(query);
      });
    }

    return list;
  });

  getBadge(p: Product) {
    return stockBadge(p);
  }

  getCategory(sku: string, category?: string) {
    return categoryOf(sku, category);
  }

  formatPrice(p: number) {
    return cop(p);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.debouncedSearch.set('');
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  resetFilters(): void {
    this.clearSearch();
    this.selectedCategory.set('ALL');
    this.selectedStatus.set('ALL');
  }

  openCreateModal(): void {
    this.editingId.set(null);
    this.formSku = '';
    this.formBrand = '';
    this.formName = '';
    this.formCategory = 'Cementos y morteros';
    this.formPrice = 0;
    this.formStock = 0;
    this.formMinimumStock = 10;
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEditModal(p: Product): void {
    this.editingId.set(p.id);
    this.formSku = p.sku;
    this.formBrand = p.brand;
    this.formName = p.name;
    this.formCategory = p.category || categoryOf(p.sku).name || 'General';
    this.formPrice = p.unitPrice;
    this.formStock = p.stock;
    this.formMinimumStock = p.minimumStock;
    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSaveProduct(): void {
    if (!this.formSku || !this.formName || !this.formBrand) {
      this.modalError.set('Por favor complete los campos obligatorios.');
      return;
    }

    const payload: ProductInput = {
      sku: this.formSku.trim().toUpperCase(),
      brand: this.formBrand.trim(),
      name: this.formName.trim(),
      category: this.formCategory || categoryOf(this.formSku).name || 'General',
      unitPrice: Number(this.formPrice),
      stock: Number(this.formStock),
      minimumStock: Number(this.formMinimumStock)
    };

    this.savingModal.set(true);
    this.modalError.set(null);

    const id = this.editingId();
    const req$ = id
      ? this.api.updateProduct(id, payload)
      : this.api.createProduct(payload);

    req$.subscribe({
      next: (res) => {
        this.savingModal.set(false);
        this.showModal.set(false);
        this.pageAlert.set(
          id
            ? `Material ${res.sku || this.formSku} actualizado correctamente.`
            : `Nuevo material registrado exitosamente en el catálogo.`
        );

        // 1. Refresca el store central para sincronizar Badge e Historial en vivo
        this.stockAlerts.refresh();

        // 2. Recarga la tabla de materiales manteniendo intactos los filtros actuales
        this.loader.reload();
      },
      error: (err) => {
        this.savingModal.set(false);
        this.modalError.set(errMsg(err));
      }
    });
  }

  onDeleteProduct(prod: Product): void {
    const confirmed = window.confirm(
      `¿Está seguro de eliminar el material "${prod.name}" (${prod.sku})? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    this.pageAlert.set(null);

    this.api.deleteProduct(prod.id).subscribe({
      next: () => {
        this.pageAlert.set(`El material ${prod.sku} fue eliminado exitosamente.`);
        this.stockAlerts.refresh();
        this.loader.reload();
      },
      error: (err) => {
        if (err.status >= 500) {
          this.pageAlert.set(
            `No se pudo eliminar el material ${prod.sku}. Probablemente tiene ventas asociadas (la base de datos restringe la eliminación de productos con transacciones).`
          );
        } else {
          this.pageAlert.set(errMsg(err));
        }
      }
    });
  }

  onExportPdf(): void {
    this.exportingPdf.set(true);
    this.pageAlert.set(null);

    this.api.downloadProductsPdf().subscribe({
      next: (blob) => {
        this.exportingPdf.set(false);
        saveBlob(blob, `Catalogo-Materiales-Firmeza-${new Date().toISOString().slice(0, 10)}.pdf`);
      },
      error: (err) => {
        this.exportingPdf.set(false);
        this.pageAlert.set(errMsg(err));
      }
    });
  }
}
