import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { KpiCardComponent } from '@components/kpi-card.component';
import { TableStateComponent } from '@components/table-state.component';
import { Product, Rental, Sale, Vehicle } from '@models/models';
import { ApiService } from '@services/api.service';
import { cop } from '@utils/catalog';
import { isRentalActive, stockBadge } from '@utils/admin';
import { errMsg } from '@utils/util';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, TableStateComponent],
  template: `
    <section class="flex flex-col gap-8">
      <!-- KPI Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-kpi-card
          [label]="'Ventas Totales del Mes'"
          [icon]="'point_of_sale'"
          [value]="kpis().monthlySalesFormatted"
          [note]="kpis().monthlySalesCount + ' transacciones registradas'"
        />

        <app-kpi-card
          [label]="'Ingresos Totales'"
          [icon]="'account_balance_wallet'"
          [value]="kpis().totalRevenueFormatted"
          [note]="'Venta de materiales + Flota pesada'"
        />

        <app-kpi-card
          [label]="'Alquileres Activos'"
          [icon]="'front_loader'"
          [value]="kpis().activeRentalsCount + ' contratos'"
          [note]="'Ocupación en patio operativo: ' + kpis().occupancyRate + '%'"
        />

        <app-kpi-card
          [label]="'Productos con Stock Bajo'"
          [icon]="'warning'"
          [value]="kpis().lowStockCount + ' referencias'"
          [note]="'Requieren reposición inmediata'"
          [danger]="kpis().lowStockCount > 0"
        />
      </div>

      <!-- Low Stock Table Section -->
      <div class="bg-white institutional-border rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div class="px-6 py-4 border-b-institutional flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-headline-sm text-headline-sm text-carbon font-semibold">
              Stock bajo
            </h2>
            <p class="font-body-sm text-body-sm text-secondary-label">
              Referencias que han cruzado el umbral mínimo operativo en bodega central
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="loadData()"
              class="h-9 px-3 institutional-border rounded-xl font-label-md text-label-md text-carbon hover:bg-warm-surface flex items-center justify-center gap-1.5 transition-colors"
              title="Recargar métricas"
            >
              <span class="material-symbols-outlined text-[16px]">refresh</span>
              <span>Actualizar</span>
            </button>

            <a
              routerLink="/admin/materiales"
              class="h-9 px-3 institutional-border rounded-xl font-label-md text-label-md text-carbon hover:bg-warm-surface flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Gestionar inventario</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>

        <app-table-state
          [loading]="loading()"
          [error]="error()"
          [empty]="lowStockProducts().length === 0"
          [emptyIcon]="'check_circle'"
          [emptyTitle]="'Sin alertas de stock bajo'"
          [emptyText]="'Todos los materiales cumplen con el stock mínimo requerido en bodega central.'"
          (retry)="loadData()"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-warm-surface border-b-institutional text-carbon font-label-sm text-label-sm uppercase">
                  <th class="py-3 px-6 font-semibold">SKU</th>
                  <th class="py-3 px-6 font-semibold">Nombre y Marca</th>
                  <th class="py-3 px-6 font-semibold">Stock Actual</th>
                  <th class="py-3 px-6 font-semibold">Stock Mínimo</th>
                  <th class="py-3 px-6 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#DEDCD8] font-body-sm text-body-sm">
                @for (prod of lowStockProducts(); track prod.id) {
                  @let badge = getBadge(prod);

                  <tr class="hover:bg-[#FDFBF7]">
                    <td class="py-3.5 px-6 font-semibold text-carbon font-mono">
                      {{ prod.sku }}
                    </td>
                    <td class="py-3.5 px-6 text-carbon">
                      <span class="font-medium">{{ prod.name }}</span>
                      <span class="text-secondary-label ml-1.5 text-[12px] font-normal">({{ prod.brand }})</span>
                    </td>
                    <td class="py-3.5 px-6 font-medium" [class]="prod.stock <= 0 ? 'text-error font-bold' : 'text-carbon'">
                      {{ prod.stock }} unidades
                    </td>
                    <td class="py-3.5 px-6 text-secondary-label">
                      {{ prod.minimumStock }} unidades
                    </td>
                    <td class="py-3.5 px-6">
                      <span class="badge-status {{ badge.cls }}">
                        {{ badge.label }}
                      </span>
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
export class AdminDashboardComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly products = signal<Product[]>([]);
  readonly sales = signal<Sale[]>([]);
  readonly rentals = signal<Rental[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);

  readonly kpis = computed(() => {
    const salesList = this.sales();
    const rentalsList = this.rentals();
    const vehiclesList = this.vehicles();
    const productsList = this.products();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Ventas no canceladas
    const validSales = salesList.filter((s) => {
      const st = String(s.status).toLowerCase();
      return st !== '2' && !st.includes('canc');
    });

    // Ventas del mes
    const monthlySales = validSales.filter((s) => {
      if (!s.createdAtUtc) return false;
      const d = new Date(s.createdAtUtc);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlySalesTotal = monthlySales.reduce((acc, s) => acc + (s.total || 0), 0);
    const monthlySalesCount = monthlySales.length;

    // Alquileres no cancelados
    const validRentals = rentalsList.filter((r) => {
      const st = String(r.status).toLowerCase();
      return st !== '3' && !st.includes('canc');
    });

    const monthlyRentals = validRentals.filter((r) => {
      if (!r.startDate) return false;
      const d = new Date(r.startDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const rentalsTotal = monthlyRentals.reduce((acc, r) => acc + (r.total || 0), 0);
    const totalRevenue = monthlySalesTotal + rentalsTotal;

    // Alquileres activos
    const activeRentals = rentalsList.filter((r) => isRentalActive(r));
    const activeRentalsCount = activeRentals.length;

    // Ocupación en patio
    const totalVehicles = vehiclesList.length;
    const rentedVehicles = vehiclesList.filter((v) => {
      const st = String(v.status).toLowerCase();
      return st === '1' || st.includes('alquil') || st.includes('rented');
    }).length;

    const occupancyRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

    // Stock bajo
    const lowStockCount = productsList.filter((p) => p.stock <= p.minimumStock).length;

    return {
      monthlySalesFormatted: cop(monthlySalesTotal),
      monthlySalesCount,
      totalRevenueFormatted: cop(totalRevenue),
      activeRentalsCount,
      occupancyRate,
      lowStockCount
    };
  });

  readonly lowStockProducts = computed(() => {
    return this.products()
      .filter((p) => p.stock <= p.minimumStock)
      .sort((a, b) => a.stock - b.stock);
  });

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      products: this.api.getProducts(),
      sales: this.api.getSales(),
      rentals: this.api.getRentals(),
      vehicles: this.api.getVehicles()
    }).subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.sales.set(res.sales);
        this.rentals.set(res.rentals);
        this.vehicles.set(res.vehicles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errMsg(err));
        this.loading.set(false);
      }
    });
  }

  getBadge(p: Product) {
    return stockBadge(p);
  }
}
