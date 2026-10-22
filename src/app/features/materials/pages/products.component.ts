import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '@components/product-card.component';
import { Product } from '@models/models';
import { ApiService } from '@services/api.service';
import { CartService } from '@services/cart.service';
import { CATEGORIES, categoryOf } from '@utils/catalog';
import { createLoader } from '@utils/util';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, RouterLink, ProductCardComponent],
  template: `
    <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 text-label-sm uppercase tracking-wider text-secondary-label">
          <span>PORTAL CORPORATIVO</span>
          <span>/</span>
          <span class="text-carbon font-semibold">CATÁLOGO B2B</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-headline-xl text-headline-xl text-carbon font-bold leading-tight">
              Materiales de Construcción
            </h1>
            <p class="font-body-md text-body-md text-secondary-label mt-1">
              Catálogo mayorista directo de planta. Los precios reflejan venta por volumen.
            </p>
          </div>

          <a
            routerLink="/cotizaciones"
            class="h-11 px-6 btn-primary-yellow font-semibold flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span class="material-symbols-outlined text-[20px]">request_quote</span>
            <span>Solicitar Cotización Formal</span>
          </a>
        </div>
      </div>

      <!-- Filters Row: Search and Category Chips -->
      <div class="bg-white border border-[#DEDCD8] rounded-xl p-5 flex flex-col gap-4 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <!-- Search input -->
          <div class="relative w-full sm:max-w-md">
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

          <!-- Total count indicator -->
          <div class="text-label-sm text-secondary-label self-end sm:self-auto font-medium">
            Mostrando {{ filteredProducts().length }} productos
          </div>
        </div>

        <!-- Category Chips -->
        <div class="flex flex-wrap gap-2 pt-2 border-t border-[#DEDCD8]">
          <button
            type="button"
            (click)="selectCategory('ALL')"
            [class]="selectedCategory() === 'ALL'
              ? 'px-3.5 py-1.5 rounded bg-carbon text-white text-label-sm font-semibold'
              : 'px-3.5 py-1.5 rounded bg-[#F4F4F2] border border-[#DEDCD8] text-carbon hover:bg-[#EBEBEA] text-label-sm font-medium transition-colors'"
          >
            Todos
          </button>

          @for (cat of availableCategories(); track cat.prefix) {
            <button
              type="button"
              (click)="selectCategory(cat.prefix)"
              [class]="selectedCategory() === cat.prefix
                ? 'px-3.5 py-1.5 rounded bg-carbon text-white text-label-sm font-semibold flex items-center gap-1.5'
                : 'px-3.5 py-1.5 rounded bg-[#F4F4F2] border border-[#DEDCD8] text-carbon hover:bg-[#EBEBEA] text-label-sm font-medium flex items-center gap-1.5 transition-colors'"
            >
              <span class="material-symbols-outlined text-[16px]">{{ cat.icon }}</span>
              <span>{{ cat.name }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Main Content Area -->
      @if (loader.loading()) {
        <!-- Skeletons: 3 animated cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1, 2, 3]; track i) {
            <div class="bg-white border border-[#DEDCD8] rounded h-[380px] p-5 flex flex-col gap-4 animate-shimmer">
              <div class="h-44 bg-[#EBEBEA] rounded"></div>
              <div class="h-5 bg-[#EBEBEA] rounded w-3/4"></div>
              <div class="h-4 bg-[#EBEBEA] rounded w-1/2"></div>
              <div class="mt-auto h-11 bg-[#EBEBEA] rounded"></div>
            </div>
          }
        </div>
      } @else if (loader.error()) {
        <!-- Error State -->
        <div class="bg-white border border-[#FFCDD2] rounded p-12 text-center flex flex-col items-center justify-center gap-3">
          <span class="material-symbols-outlined text-[54px] text-error">cloud_off</span>
          <h2 class="font-headline-sm text-headline-sm text-error font-semibold">
            No pudimos cargar el catálogo
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
      } @else if (filteredProducts().length === 0) {
        <!-- Empty State -->
        <div class="bg-white border border-[#DEDCD8] rounded p-12 text-center flex flex-col items-center justify-center gap-3">
          <span class="material-symbols-outlined text-[54px] text-secondary-label">
            search_off
          </span>
          <h2 class="font-headline-sm text-headline-sm text-carbon font-semibold">
            No hay materiales que coincidan con la búsqueda
          </h2>
          <p class="font-body-sm text-body-sm text-secondary-label max-w-md">
            Intente con otros términos o seleccione otra categoría del catálogo.
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
        <!-- Products Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (prod of paginatedProducts(); track prod.id) {
            <app-product-card
              [product]="prod"
              (add)="onAddToCart($event)"
            />
          }
        </div>

        <!-- Pagination Controls (6 per page) -->
        @if (totalPages() > 1) {
          <nav
            aria-label="Paginación del catálogo"
            class="flex flex-wrap items-center justify-center gap-2 mt-4 pt-6 border-t border-[#DEDCD8]"
          >
            <button
              type="button"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
              class="h-10 px-4 bg-white border border-[#DEDCD8] rounded text-carbon text-label-sm font-semibold hover:bg-[#F4F4F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            @for (p of pageNumbers(); track p) {
              <button
                type="button"
                (click)="goToPage(p)"
                [attr.aria-current]="currentPage() === p ? 'page' : null"
                [class]="currentPage() === p
                  ? 'w-10 h-10 bg-carbon text-white rounded font-bold text-label-sm'
                  : 'w-10 h-10 bg-white border border-[#DEDCD8] text-carbon rounded font-semibold text-label-sm hover:bg-[#F4F4F2] transition-colors'"
              >
                {{ p }}
              </button>
            }

            <button
              type="button"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)"
              class="h-10 px-4 bg-white border border-[#DEDCD8] rounded text-carbon text-label-sm font-semibold hover:bg-[#F4F4F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </nav>
        }
      }
    </div>
  `
})
export class ProductsComponent {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);

  readonly loader = createLoader<Product[]>(() => this.api.getProducts(), []);

  readonly searchQuery = signal<string>('');
  readonly debouncedSearch = signal<string>('');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  readonly selectedCategory = signal<string>('ALL');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 6;

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.debouncedSearch.set(val);
      this.currentPage.set(1);
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.debouncedSearch.set('');
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.currentPage.set(1);
  }

  readonly availableCategories = computed(() => {
    const prods = this.loader.data() || [];
    const prefixes = new Set<string>();
    for (const p of prods) {
      if (p.sku && p.sku.length >= 3) {
        prefixes.add(p.sku.substring(0, 3).toUpperCase());
      }
    }
    return Array.from(prefixes).map((prefix) => {
      const info = CATEGORIES[prefix] ?? { name: prefix, icon: 'category' };
      return { prefix, ...info };
    });
  });

  readonly filteredProducts = computed(() => {
    let list = this.loader.data() || [];
    const query = (this.debouncedSearch() || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cat = this.selectedCategory();

    if (cat !== 'ALL') {
      list = list.filter((p) => {
        const pref = (p.sku || '').toUpperCase().substring(0, 3);
        const info = categoryOf(p.sku, p.category);
        const catNorm = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const infoNorm = info.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const pCatNorm = (p.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return pref === cat || infoNorm.includes(catNorm) || pCatNorm.includes(catNorm);
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

  readonly totalPages = computed(() => {
    const total = this.filteredProducts().length;
    return Math.ceil(total / this.pageSize) || 1;
  });

  readonly paginatedProducts = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  readonly pageNumbers = computed(() => {
    const count = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= count; i++) {
      pages.push(i);
    }
    return pages;
  });

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.currentPage.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetFilters(): void {
    this.clearSearch();
    this.selectedCategory.set('ALL');
    this.currentPage.set(1);
  }

  onAddToCart(product: Product): void {
    this.cart.add(product);
  }
}
