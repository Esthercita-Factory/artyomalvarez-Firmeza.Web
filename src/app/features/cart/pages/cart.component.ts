import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertComponent } from '@components/alert.component';
import { ApiService } from '@services/api.service';
import { CartService } from '@services/cart.service';
import { StockAlertsService } from '@services/stock-alerts.service';
import { cop } from '@utils/catalog';
import { errMsg } from '@utils/util';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule, RouterLink, AlertComponent],
  template: `
    <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 text-label-sm uppercase tracking-wider text-secondary-label">
          <span>PORTAL CORPORATIVO</span>
          <span>/</span>
          <span class="text-carbon font-semibold">ORDEN DE COMPRA</span>
        </div>

        <div>
          <h1 class="font-headline-xl text-headline-xl text-carbon font-bold leading-tight">
            Carrito de Materiales
          </h1>
          <p class="font-body-md text-body-md text-secondary-label mt-1">
            Revise los materiales agregados, ajuste las cantidades y confirme la transacción.
          </p>
        </div>
      </div>

      <app-alert [text]="errorMessage()" />

      @if (successMessage()) {
        <div class="p-6 rounded-xl institutional-border bg-[#E8F5E9] text-[#1E7B3A] border-[#A5D6A7] flex flex-col items-center justify-center text-center gap-3">
          <span class="material-symbols-outlined text-[48px]">check_circle</span>
          <h2 class="font-headline-sm text-headline-sm font-bold">¡Compra confirmada con éxito!</h2>
          <p class="font-body-sm text-body-sm max-w-md">
            {{ successMessage() }}
          </p>
          <a
            routerLink="/materiales"
            class="mt-3 px-6 py-2.5 btn-primary-yellow font-semibold rounded text-carbon"
          >
            Volver al Catálogo de Materiales
          </a>
        </div>
      } @else if (cart.items().length === 0) {
        <!-- Empty Cart -->
        <div class="bg-white border border-[#DEDCD8] rounded p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
          <span class="material-symbols-outlined text-[64px] text-secondary-label">
            remove_shopping_cart
          </span>
          <h2 class="font-headline-sm text-headline-sm text-carbon font-semibold">
            Su carrito de compras está vacío
          </h2>
          <p class="font-body-sm text-body-sm text-secondary-label max-w-md">
            No ha agregado ningún material a su orden actual. Explore nuestro catálogo B2B para añadir productos.
          </p>
          <a
            routerLink="/materiales"
            class="h-11 px-6 btn-primary-yellow font-semibold flex items-center justify-center gap-2 mt-2"
          >
            <span class="material-symbols-outlined text-[20px]">storefront</span>
            <span>Explorar Materiales</span>
          </a>
        </div>
      } @else {
        <!-- Cart Contents & Summary -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <!-- Cart Table -->
          <div class="lg:col-span-2 bg-white border border-[#DEDCD8] rounded overflow-hidden shadow-sm flex flex-col">
            <div class="px-6 py-4 border-b border-[#DEDCD8] flex items-center justify-between">
              <span class="font-headline-sm text-headline-sm text-carbon font-semibold">
                Productos Seleccionados ({{ cart.count() }})
              </span>
              <button
                type="button"
                (click)="cart.clear()"
                class="text-label-sm text-error hover:underline flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>Vaciar Carrito</span>
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-[#F4F4F2] border-b border-[#DEDCD8] text-carbon font-label-sm text-label-sm uppercase">
                    <th class="py-3 px-6 font-semibold">Material</th>
                    <th class="py-3 px-6 font-semibold">Precio Unit.</th>
                    <th class="py-3 px-6 font-semibold">Cantidad</th>
                    <th class="py-3 px-6 font-semibold">Subtotal</th>
                    <th class="py-3 px-4 font-semibold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                  @for (item of cart.items(); track item.product.id) {
                    <tr class="hover:bg-[#FAF9F7]">
                      <td class="py-4 px-6">
                        <div class="flex flex-col">
                          <span class="text-[11px] font-mono text-secondary-label">
                            {{ item.product.sku }}
                          </span>
                          <span class="font-semibold text-carbon">
                            {{ item.product.name }}
                          </span>
                          <span class="text-[12px] text-secondary-label">
                            Marca: {{ item.product.brand }} • Stock: {{ item.product.stock }}
                          </span>
                        </div>
                      </td>

                      <td class="py-4 px-6 text-carbon font-medium">
                        {{ formatCurrency(item.product.unitPrice) }}
                      </td>

                      <td class="py-4 px-6">
                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            (click)="cart.setQty(item.product.id, item.qty - 1)"
                            class="w-8 h-8 rounded border border-[#DEDCD8] bg-[#F4F4F2] hover:bg-[#EBEBEA] flex items-center justify-center font-bold text-carbon"
                            aria-label="Disminuir cantidad"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            [value]="item.qty"
                            min="1"
                            [max]="item.product.stock"
                            (change)="onQtyChange(item.product.id, $any($event.target).value)"
                            class="w-14 h-8 text-center border border-[#DEDCD8] rounded font-semibold text-carbon text-body-sm"
                          />
                          <button
                            type="button"
                            [disabled]="item.qty >= item.product.stock"
                            (click)="cart.setQty(item.product.id, item.qty + 1)"
                            class="w-8 h-8 rounded border border-[#DEDCD8] bg-[#F4F4F2] hover:bg-[#EBEBEA] flex items-center justify-center font-bold text-carbon disabled:opacity-40"
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td class="py-4 px-6 text-carbon font-bold">
                        {{ formatCurrency(item.product.unitPrice * item.qty) }}
                      </td>

                      <td class="py-4 px-4 text-center">
                        <button
                          type="button"
                          (click)="cart.setQty(item.product.id, 0)"
                          class="p-1.5 text-secondary-label hover:text-error transition-colors"
                          title="Eliminar producto"
                          aria-label="Eliminar"
                        >
                          <span class="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Order Summary Card -->
          <div class="bg-white border border-[#DEDCD8] rounded p-6 flex flex-col gap-6 shadow-sm">
            <h3 class="font-title-md text-title-md text-carbon font-semibold border-b border-[#DEDCD8] pb-3">
              Resumen de la Orden
            </h3>

            <div class="flex flex-col gap-3 font-body-sm text-body-sm">
              <div class="flex justify-between items-center text-secondary-label">
                <span>Subtotal bruto</span>
                <span class="font-medium text-carbon">{{ formatCurrency(cart.subtotal()) }}</span>
              </div>

              <div class="flex justify-between items-center text-secondary-label">
                <span>IVA (19 %)</span>
                <span class="font-medium text-carbon">{{ formatCurrency(taxAmount()) }}</span>
              </div>

              <div class="pt-3 border-t border-[#DEDCD8] flex justify-between items-baseline">
                <span class="font-bold text-carbon text-title-md">Total a Pagar</span>
                <span class="font-headline-md text-headline-sm text-carbon font-bold">
                  {{ formatCurrency(total()) }}
                </span>
              </div>
            </div>

            <button
              type="button"
              [disabled]="submitting() || cart.items().length === 0"
              (click)="onConfirmPurchase()"
              class="w-full h-12 btn-primary-yellow font-semibold text-body-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              @if (submitting()) {
                <div class="w-5 h-5 border-2 border-carbon border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando compra...</span>
              } @else {
                <span class="material-symbols-outlined text-[20px]">shopping_bag</span>
                <span>Confirmar Compra</span>
              }
            </button>

            <p class="text-[11px] text-secondary-label text-center leading-relaxed">
              Al confirmar, se generará una orden formal con factura electrónica y recibo digital bajo la normatividad de la DIAN.
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class CartComponent {
  private readonly api = inject(ApiService);
  readonly cart = inject(CartService);
  private readonly stockAlerts = inject(StockAlertsService);
  private readonly router = inject(Router);

  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly taxAmount = computed(() => this.cart.subtotal() * 0.19);
  readonly total = computed(() => this.cart.subtotal() + this.taxAmount());

  onQtyChange(id: string, val: unknown): void {
    const qty = parseInt(String(val), 10);
    this.cart.setQty(id, isNaN(qty) ? 1 : qty);
  }

  formatCurrency(n: number): string {
    return cop(n);
  }

  onConfirmPurchase(): void {
    if (this.cart.items().length === 0) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const items = this.cart.items().map((i) => ({
      productId: i.product.id,
      quantity: i.qty
    }));

    this.api
      .createSale({
        items
      })
      .subscribe({
        next: (sale) => {
          this.submitting.set(false);
          this.cart.clear();
          this.stockAlerts.refresh();
          const ref = sale.saleNumber || `VEN-${sale.id.substring(0, 8).toUpperCase()}`;
          this.successMessage.set(
            `Su orden ha sido registrada exitosamente con el consecutivo ${ref}. Puede consultar el detalle en su historial de ventas.`
          );
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(errMsg(err));
        }
      });
  }
}
