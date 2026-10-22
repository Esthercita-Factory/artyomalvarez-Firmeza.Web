import { Component, computed, input, output } from '@angular/core';
import { Product } from '@models/models';
import { categoryOf, cop, stockState } from '@utils/catalog';

@Component({
  selector: 'app-product-card',
  standalone: true,
  template: `
    @let p = product();
    @let cat = categoryInfo();
    @let state = stateInfo();

    <article class="bg-white border border-[#DEDCD8] rounded flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <!-- Image/Icon Header -->
      <div class="h-44 bg-[#F4F4F2] border-b border-[#DEDCD8] flex flex-col items-center justify-center p-4 relative">
        <span class="material-symbols-outlined text-[54px] text-carbon/70">
          {{ cat.icon }}
        </span>
        <span class="absolute top-3 left-3 text-[11px] font-mono text-secondary-label bg-white px-2 py-0.5 rounded border border-[#DEDCD8]">
          {{ p.sku }}
        </span>
        <span class="absolute top-3 right-3 text-[11px] font-semibold text-secondary-label">
          {{ cat.name }}
        </span>
      </div>

      <!-- Card Body -->
      <div class="p-5 flex flex-col gap-2 flex-1 justify-between">
        <div class="flex flex-col gap-1">
          <h3 class="font-headline-sm text-headline-sm text-carbon font-semibold line-clamp-2 leading-snug">
            {{ p.name }}
          </h3>
          <span class="font-body-sm text-body-sm text-secondary-label font-medium">
            Marca: {{ p.brand }}
          </span>
          <div class="mt-1">
            <span class="badge-status {{ state.cls }}">
              {{ state.label }}
            </span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-[#DEDCD8] flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <span class="font-label-sm text-label-sm text-secondary-label">Precio Unitario</span>
            <span class="font-headline-sm text-headline-sm text-carbon font-bold">
              {{ formattedPrice() }}
            </span>
          </div>

          @if (state.out) {
            <button
              type="button"
              disabled
              class="w-full h-11 bg-[#EBEBEA] text-[#8C8885] font-semibold rounded cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">block</span>
              <span>No disponible</span>
            </button>
          } @else {
            <button
              type="button"
              class="w-full h-11 btn-primary-yellow font-semibold flex items-center justify-center gap-2"
              (click)="add.emit(p)"
            >
              <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>Agregar al carrito</span>
            </button>
          }
        </div>
      </div>
    </article>
  `
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly add = output<Product>();

  readonly categoryInfo = computed(() => categoryOf(this.product().sku, this.product().category));
  readonly stateInfo = computed(() => stockState(this.product()));
  readonly formattedPrice = computed(() => cop(this.product().unitPrice));
}
