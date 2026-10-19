import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alert',
  standalone: true,
  template: `
    @if (text()) {
      <div
        class="p-4 rounded-xl institutional-border bg-[#FFF8F8] text-[#B3261E] flex items-start gap-3 border-[#FFCDD2]"
        role="alert"
      >
        <span class="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">error</span>
        <div class="text-body-sm font-medium flex-1">
          {{ text() }}
        </div>
      </div>
    }
  `
})
export class AlertComponent {
  readonly text = input<string | null | undefined>(null);
}
