export function num(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v.replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function money(n: number | undefined | null): string {
  const val = Number(n ?? 0);
  const formatted = Math.round(val).toLocaleString('es-CO');
  return `$ ${formatted}`;
}

export interface BadgeInfo {
  label: string;
  cls: string;
}

export const VEHICLE_TYPES: Record<number, string> = {
  0: 'Maquinaria pesada',
  1: 'Camiones',
  2: 'Remolques'
};

export const VEHICLE_STATUSES: Record<number, BadgeInfo> = {
  0: { label: 'Disponible', cls: 'status-disponible' },
  1: { label: 'Alquilado', cls: 'status-activo' },
  2: { label: 'Mantenimiento', cls: 'status-alerta' }
};

export function vehicleType(v: { type: string | number } | undefined | null): string {
  if (!v) return 'Maquinaria pesada';
  const val = v.type;
  if (typeof val === 'number') {
    return VEHICLE_TYPES[val] ?? 'Maquinaria pesada';
  }
  const str = String(val).trim().toLowerCase();
  if (str === '0' || str.includes('pesada')) return 'Maquinaria pesada';
  if (str === '1' || str.includes('camion')) return 'Camiones';
  if (str === '2' || str.includes('remolque')) return 'Remolques';
  return String(val);
}

export function vehicleStatus(v: { status: string | number } | undefined | null): BadgeInfo {
  if (!v) return { label: 'Disponible', cls: 'status-disponible' };
  const val = v.status;
  if (typeof val === 'number') {
    return VEHICLE_STATUSES[val] ?? { label: 'Desconocido', cls: 'status-neutral' };
  }
  const str = String(val).trim().toLowerCase();
  if (str === '0' || str.includes('disponible') || str.includes('available')) {
    return { label: 'Disponible', cls: 'status-disponible' };
  }
  if (str === '1' || str.includes('alquilado') || str.includes('rented')) {
    return { label: 'Alquilado', cls: 'status-activo' };
  }
  if (str === '2' || str.includes('mantenimiento') || str.includes('maintenance')) {
    return { label: 'En mantenimiento', cls: 'status-alerta' };
  }
  return { label: String(val), cls: 'status-neutral' };
}

export function saleStatus(v: { status: string | number } | undefined | null): BadgeInfo {
  if (!v) return { label: 'Completada', cls: 'status-disponible' };
  const val = v.status;
  if (typeof val === 'number') {
    if (val === 0) return { label: 'Pendiente', cls: 'status-alerta' };
    if (val === 1) return { label: 'Completada', cls: 'status-disponible' };
    if (val === 2) return { label: 'Cancelada', cls: 'status-agotado' };
  }
  const str = String(val).trim().toLowerCase();
  if (str === '0' || str.includes('pend')) return { label: 'Pendiente', cls: 'status-alerta' };
  if (str === '1' || str.includes('comp')) return { label: 'Completada', cls: 'status-disponible' };
  if (str === '2' || str.includes('canc')) return { label: 'Cancelada', cls: 'status-agotado' };
  return { label: String(val), cls: 'status-neutral' };
}

export function isRentalActive(v: { status: string | number } | undefined | null): boolean {
  if (!v) return false;
  const val = v.status;
  if (typeof val === 'number') return val === 1;
  const str = String(val).trim().toLowerCase();
  return str === '1' || str === 'activo' || str === 'active';
}

export function stockBadge(p: { stock: number; minimumStock: number }): BadgeInfo {
  if (p.stock <= 0) {
    return { label: 'Agotado', cls: 'status-agotado' };
  }
  if (p.stock <= p.minimumStock) {
    return { label: 'Pocas unidades', cls: 'status-alerta' };
  }
  return { label: 'Disponible', cls: 'status-disponible' };
}
