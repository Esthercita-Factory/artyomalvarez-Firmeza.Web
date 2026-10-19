export interface CategoryInfo {
  name: string;
  icon: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  CEM: { name: 'Cementos y morteros', icon: 'foundation' },
  ACE: { name: 'Acero y hierro', icon: 'reorder' },
  MAM: { name: 'Mampostería', icon: 'view_in_ar' },
  AGR: { name: 'Agregados', icon: 'grain' },
  PIN: { name: 'Pinturas', icon: 'format_paint' }
};

export function categoryOf(sku: string | undefined | null): CategoryInfo {
  if (!sku) {
    return { name: 'Otros', icon: 'inventory_2' };
  }
  const prefix = sku.trim().substring(0, 3).toUpperCase();
  return CATEGORIES[prefix] ?? { name: 'Otros', icon: 'inventory_2' };
}

export function cop(n: number | undefined | null): string {
  const val = Number(n ?? 0);
  const formatted = Math.round(val).toLocaleString('es-CO');
  return `$ ${formatted} COP`;
}

export interface StockState {
  label: string;
  out: boolean;
  cls: string;
}

export function stockState(p: { stock: number; minimumStock: number }): StockState {
  if (p.stock <= 0) {
    return { label: 'Agotado', out: true, cls: 'status-agotado' };
  }
  if (p.stock <= p.minimumStock) {
    return { label: 'Pocas unidades', out: false, cls: 'status-alerta' };
  }
  return { label: 'Disponible', out: false, cls: 'status-disponible' };
}
