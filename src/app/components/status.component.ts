import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-status',
  standalone: true,
  template: `
    @if (loading()) {
      <div class="p-12 flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 border-3 border-[#DEDCD8] border-t-[#FDDA24] rounded-full animate-spin"></div>
        <span class="font-body-sm text-body-sm text-secondary-label">Cargando información...</span>
      </div>
    } @else if (error()) {
      <div class="p-8 text-center flex flex-col items-center justify-center gap-3 bg-[#FFF8F8] institutional-border border-[#FFCDD2] rounded-xl">
        <span class="material-symbols-outlined text-[40px] text-error">cloud_off</span>
        <p class="font-body-sm text-body-sm text-error font-medium max-w-md">{{ error() }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-white institutional-border rounded-xl text-carbon font-semibold hover:bg-warm-surface transition-colors"
          (click)="retry.emit()"
        >
          Reintentar
        </button>
      </div>
    } @else {
      <ng-content />
    }
  `
})
export class StatusComponent {
  readonly loading = input<boolean>(false);
  readonly error = input<string | null | undefined>(null);
  readonly retry = output<void>();
}
