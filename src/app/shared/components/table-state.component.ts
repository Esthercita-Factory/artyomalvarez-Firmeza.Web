import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-table-state',
  standalone: true,
  template: `
    @if (loading()) {
      <div class="p-8 flex flex-col gap-3 w-full">
        <div class="h-9 bg-warm-surface rounded-xl animate-pulse w-full"></div>
        <div class="h-9 bg-warm-surface rounded-xl animate-pulse w-full"></div>
        <div class="h-9 bg-warm-surface rounded-xl animate-pulse w-full"></div>
        <div class="h-9 bg-warm-surface rounded-xl animate-pulse w-full"></div>
      </div>
    } @else if (error()) {
      <div class="p-12 text-center flex flex-col items-center justify-center gap-2 bg-[#FFF8F8] w-full">
        <span class="material-symbols-outlined text-[48px] text-error">cloud_off</span>
        <p class="font-headline-sm text-headline-sm text-error font-semibold">
          {{ errorTitle() }}
        </p>
        <p class="font-body-sm text-body-sm text-secondary-label max-w-lg">
          {{ error() }}
        </p>
        <button
          type="button"
          class="mt-2 px-4 py-2 bg-white institutional-border rounded-xl text-carbon font-semibold hover:bg-warm-surface transition-colors"
          (click)="retry.emit()"
        >
          Reintentar
        </button>
      </div>
    } @else if (empty()) {
      <div class="p-12 text-center flex flex-col items-center justify-center gap-2 w-full">
        <span class="material-symbols-outlined text-[48px] text-secondary-label">
          {{ emptyIcon() }}
        </span>
        <p class="font-headline-sm text-headline-sm text-carbon font-semibold">
          {{ emptyTitle() }}
        </p>
        <p class="font-body-sm text-body-sm text-secondary-label max-w-md">
          {{ emptyText() }}
        </p>
        @if (resettable()) {
          <button
            type="button"
            class="mt-2 px-4 py-2 bg-white institutional-border rounded-xl text-carbon font-semibold hover:bg-warm-surface transition-colors"
            (click)="reset.emit()"
          >
            Restablecer filtros
          </button>
        }
      </div>
    } @else {
      <ng-content />
    }
  `
})
export class TableStateComponent {
  readonly loading = input<boolean>(false);
  readonly error = input<string | null | undefined>(null);
  readonly empty = input<boolean>(false);
  readonly errorTitle = input<string>('Error al consultar datos');
  readonly emptyIcon = input<string>('inventory_2');
  readonly emptyTitle = input<string>('No hay registros disponibles');
  readonly emptyText = input<string>('No se encontraron elementos para mostrar.');
  readonly resettable = input<boolean>(false);

  readonly retry = output<void>();
  readonly reset = output<void>();
}
