import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="bg-white institutional-border rounded-xl p-5 flex flex-col gap-2 shadow-sm">
      <div class="flex items-center justify-between text-secondary-label">
        <span class="font-label-sm text-label-sm uppercase tracking-wider font-semibold">{{ label() }}</span>
        <span class="material-symbols-outlined text-[20px]" [class.text-error]="danger()">
          {{ icon() }}
        </span>
      </div>
      <span class="font-headline-lg text-headline-md text-carbon font-semibold tracking-tight">
        {{ value() }}
      </span>
      @if (note()) {
        <p class="font-body-sm text-body-sm" [class]="danger() ? 'text-error font-medium' : 'text-secondary-label'">
          {{ note() }}
        </p>
      }
    </div>
  `
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly value = input.required<string | number>();
  readonly note = input<string | null | undefined>(null);
  readonly danger = input<boolean>(false);
}
