import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  Customer,
  DashboardMetrics,
  ImportResult,
  Product,
  ProductInput,
  Rental,
  RentalQuote,
  RentalRequest,
  Sale,
  SaleInput,
  Vehicle,
  VehicleInput
} from '@models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // SUPUESTO: Los listados devuelven array plano o { items } o { data }
  private list<T>(path: string, params?: HttpParams | Record<string, string | number | boolean>): Observable<T[]> {
    return this.http.get<unknown>(`${this.baseUrl}/${path}`, { params }).pipe(
      map((r: unknown) => {
        if (Array.isArray(r)) return r as T[];
        if (r && typeof r === 'object') {
          const obj = r as Record<string, unknown>;
          if (Array.isArray(obj['items'])) return obj['items'] as T[];
          if (Array.isArray(obj['data'])) return obj['data'] as T[];
        }
        return [] as T[];
      })
    );
  }

  // --- Productos ---
  getProducts(filters?: {
    search?: string;
    category?: string;
    status?: string;
    lowStock?: boolean;
    onlyActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Observable<Product[]> {
    let params: Record<string, string | number | boolean> | undefined;
    if (filters) {
      params = {};
      if (filters.search && filters.search.trim() !== '') params['search'] = filters.search.trim();
      if (filters.category && filters.category !== 'ALL') params['category'] = filters.category;
      if (filters.status && filters.status !== 'ALL') params['status'] = filters.status;
      if (filters.lowStock !== undefined) params['lowStock'] = filters.lowStock;
      if (filters.onlyActive !== undefined) params['onlyActive'] = filters.onlyActive;
      if (filters.page !== undefined && filters.page > 0) params['page'] = filters.page;
      if (filters.pageSize !== undefined && filters.pageSize > 0) params['pageSize'] = filters.pageSize;
    }
    return this.list<Product>('Products', params);
  }

  getLowStock(): Observable<Product[]> {
    return this.list<Product>('Products/low-stock');
  }

  getLowStockCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/Products/low-stock/count`);
  }

  createProduct(b: ProductInput): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/Products`, b);
  }

  updateProduct(id: string, b: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/Products/${id}`, b);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Products/${id}`);
  }

  // --- Vehículos / Flota ---
  getVehicles(): Observable<Vehicle[]> {
    return this.list<Vehicle>('Vehicles');
  }

  createVehicle(b: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.baseUrl}/Vehicles`, b);
  }

  updateVehicle(id: string, b: VehicleInput): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.baseUrl}/Vehicles/${id}`, b);
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Vehicles/${id}`);
  }

  // --- Clientes ---
  getCustomers(): Observable<Customer[]> {
    return this.list<Customer>('Customers');
  }

  // --- Ventas ---
  getSales(): Observable<Sale[]> {
    return this.list<Sale>('Sales');
  }

  createSale(b: SaleInput): Observable<Sale> {
    return this.http.post<Sale>(`${this.baseUrl}/Sales`, b);
  }

  // SUPUESTO: El endpoint de PDF en backend es /Sales/{id}/receipt con fallback a /Sales/{id}/pdf
  downloadSalePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Sales/${id}/receipt`, {
      responseType: 'blob'
    });
  }

  downloadProductsPdf(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Products/export-pdf`, {
      responseType: 'blob'
    });
  }

  downloadCustomersPdf(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/Customers/export-pdf`, {
      responseType: 'blob'
    });
  }

  // --- Alquileres / Cotizaciones ---
  getRentals(): Observable<Rental[]> {
    return this.list<Rental>('Rentals');
  }

  quoteRental(b: RentalRequest): Observable<RentalQuote> {
    let params = new HttpParams()
      .set('vehicleId', b.vehicleId)
      .set('startDate', b.startDate)
      .set('endDate', b.endDate);

    if (b.customerId) {
      params = params.set('customerId', b.customerId);
    }

    return this.http.post<RentalQuote>(`${this.baseUrl}/Rentals/quote`, b, { params });
  }

  createRental(b: RentalRequest): Observable<Rental> {
    return this.http.post<Rental>(`${this.baseUrl}/Rentals`, b);
  }

  // --- Dashboard ---
  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.baseUrl}/Dashboard/metrics`);
  }

  // --- Excel Import / Export ---
  // SUPUESTO: Rutas /Excel/export-{module} o /Excel/export/{module}
  exportExcel(module: string): Observable<Blob> {
    const cleanMod = module.toLowerCase().replace(/[^a-z]/g, '');
    return this.http.get(`${this.baseUrl}/Excel/export-${cleanMod}`, {
      responseType: 'blob'
    });
  }

  importExcel(kind: string, file: File): Observable<ImportResult> {
    const cleanKind = kind.toLowerCase().replace(/[^a-z]/g, '');
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.baseUrl}/Excel/import-${cleanKind}`, formData);
  }
}
