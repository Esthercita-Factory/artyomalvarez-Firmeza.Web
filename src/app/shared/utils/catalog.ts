export interface CategoryInfo {
  name: string;
  icon: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  CEM: { name: 'Cementos y morteros', icon: 'foundation' },
  AGR: { name: 'Agregados (arena, grava)', icon: 'grain' },
  LAD: { name: 'Ladrillos y bloques', icon: 'view_in_ar' },
  MAM: { name: 'Ladrillos y bloques', icon: 'view_in_ar' },
  HIE: { name: 'Hierro y acero', icon: 'reorder' },
  ACE: { name: 'Hierro y acero', icon: 'reorder' },
  PIN: { name: 'Pinturas', icon: 'format_paint' },
  HER: { name: 'Herramientas', icon: 'handyman' },
  ELE: { name: 'Eléctricos', icon: 'bolt' },
  PLO: { name: 'Plomería', icon: 'water_drop' }
};

export function categoryOf(sku: string | undefined | null, categoryName?: string | null): CategoryInfo {
  if (categoryName && categoryName.trim() !== '' && categoryName.toLowerCase() !== 'otros') {
    const norm = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm.includes('cemento') || norm.includes('mortero') || norm.includes('pega')) return CATEGORIES['CEM'];
    if (norm.includes('agregado') || norm.includes('arena') || norm.includes('grava') || norm.includes('arido') || norm.includes('triturado') || norm.includes('piedra') || norm.includes('base')) return CATEGORIES['AGR'];
    if (norm.includes('ladrillo') || norm.includes('bloque') || norm.includes('mamposteria') || norm.includes('tolete') || norm.includes('adoquin')) return CATEGORIES['LAD'];
    if (norm.includes('hierro') || norm.includes('acero') || norm.includes('varilla') || norm.includes('malla') || norm.includes('alambre')) return CATEGORIES['HIE'];
    if (norm.includes('pintura') || norm.includes('esmalte') || norm.includes('estuco') || norm.includes('vinilo') || norm.includes('anticorrosivo')) return CATEGORIES['PIN'];
    if (norm.includes('herramienta') || norm.includes('disco') || norm.includes('pulidora') || norm.includes('taladro') || norm.includes('pala') || norm.includes('nivel') || norm.includes('carretilla') || norm.includes('rotomartillo')) return CATEGORIES['HER'];
    if (norm.includes('electrico') || norm.includes('cable') || norm.includes('breaker') || norm.includes('tablero') || norm.includes('conduit')) return CATEGORIES['ELE'];
    if (norm.includes('plomeria') || norm.includes('tubo') || norm.includes('tanque') || norm.includes('valvula') || norm.includes('soldadura') || norm.includes('hidrosanitario')) return CATEGORIES['PLO'];
    return { name: categoryName, icon: 'inventory_2' };
  }

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
