import { inject, Injectable, signal } from '@angular/core';
import { Product } from '@models/models';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class StockAlertsService {
  private readonly api = inject(ApiService);

  readonly lowStockCount = signal<number>(0);
  readonly lowStockItems = signal<Product[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  constructor() {
    this.refresh();

    if (typeof window !== 'undefined') {
      // Auto-refresco periódico cada 60s
      setInterval(() => this.refresh(), 60000);
      // Refresco inmediato al recuperar el foco de la ventana
      window.addEventListener('focus', () => this.refresh());
    }
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getLowStock().subscribe({
      next: (items) => {
        // Garantiza la regla única: p.stock <= p.minimumStock
        const valid = (items || []).filter((p) => p.stock <= p.minimumStock);
        this.lowStockItems.set(valid);
        this.lowStockCount.set(valid.length);
        this.loading.set(false);
        this.lastUpdated.set(new Date());
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Error al obtener alertas de stock');
      }
    });
  }
}
