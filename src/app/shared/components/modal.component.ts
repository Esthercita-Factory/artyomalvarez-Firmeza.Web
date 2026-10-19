import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/50 backdrop-blur-[1px]"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-white institutional-border rounded-xl w-full max-w-xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between border-b-institutional pb-3">
          <div class="flex items-center gap-2">
            @if (icon()) {
              <span class="material-symbols-outlined text-carbon">{{ icon() }}</span>
            }
            <h3 class="font-headline-sm text-headline-sm text-carbon font-semibold">
              {{ title() }}
            </h3>
          </div>
          <button
            type="button"
            class="p-1 text-secondary-label hover:text-carbon rounded transition-colors"
            (click)="close.emit()"
            aria-label="Cerrar"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <ng-content />
      </div>
    </div>
  `
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly icon = input<string | null | undefined>(null);
  readonly close = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
