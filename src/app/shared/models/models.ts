export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category?: string;
  description?: string;
  unitPrice: number;
  stock: number;
  minimumStock: number;
  isActive?: boolean;
  isLowStock?: boolean;
  status?: string;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  status?: string;
  lowStock?: boolean;
  onlyActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductInput {
  sku: string;
  name: string;
  brand: string;
  category?: string;
  unitPrice: number;
  stock: number;
  minimumStock: number;
}

export interface Customer {
  id: string;
  documentNumber: string;
  documentType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: string | number;
  dailyRate: number;
  loadCapacity: number | string;
  status: string | number;
  isActive: boolean;
}

export interface VehicleInput {
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: number;
  dailyRate: number;
  loadCapacity: number | string;
  status: number;
  isActive: boolean;
}

export interface Rental {
  id: string;
  customerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  daysRented: number;
  dailyRate: number;
  subtotal: number;
  taxRate: number;
  total: number;
  status: string | number;
}

export interface Sale {
  id: string;
  saleNumber?: string;
  customerId: string;
  createdAtUtc: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string | number;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface SaleInput {
  customerId?: string;
  items: SaleItemInput[];
}

export interface LoginResponse {
  token: string;
  [k: string]: unknown;
}

export interface RentalRequest {
  customerId?: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
}

export interface RentalQuote {
  days?: number;
  daysRented?: number;
  dailyRate?: number;
  subtotal: number;
  tax?: number;
  total: number;
}

export interface DashboardMetrics {
  totalSalesRevenue?: number;
  totalSalesCount?: number;
  totalRentalsRevenue?: number;
  activeRentalsCount?: number;
  totalCustomersCount?: number;
  lowStockProductsCount?: number;
  availableVehiclesCount?: number;
  [k: string]: unknown;
}

export interface ImportResult {
  processed?: number;
  created?: number;
  errors?: { row: number; value?: string; message: string }[];
  [k: string]: unknown;
}
