import { computed, Injectable, signal } from '@angular/core';
import { Product } from '@models/models';

export interface CartItem {
  product: Product;
  qty: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  readonly items = signal<CartItem[]>([]);

  readonly count = computed<number>(() => {
    return this.items().reduce((acc, item) => acc + item.qty, 0);
  });

  readonly subtotal = computed<number>(() => {
    return this.items().reduce((acc, item) => acc + item.product.unitPrice * item.qty, 0);
  });

  add(p: Product): void {
    if (p.stock <= 0) return;

    this.items.update((current) => {
      const existingIndex = current.findIndex((item) => item.product.id === p.id);
      if (existingIndex > -1) {
        const item = current[existingIndex];
        const newQty = Math.min(item.qty + 1, p.stock);
        const updated = [...current];
        updated[existingIndex] = { ...item, qty: newQty };
        return updated;
      } else {
        return [...current, { product: p, qty: 1 }];
      }
    });
  }

  setQty(id: string, qty: number): void {
    this.items.update((current) => {
      if (qty <= 0) {
        return current.filter((item) => item.product.id !== id);
      }
      return current.map((item) => {
        if (item.product.id === id) {
          const clamped = Math.min(qty, item.product.stock);
          return { ...item, qty: clamped };
        }
        return item;
      });
    });
  }

  clear(): void {
    this.items.set([]);
  }
}
