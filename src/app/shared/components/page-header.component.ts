import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="font-headline-md text-headline-md text-carbon font-semibold">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="font-body-sm text-body-sm text-secondary-label">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex items-center gap-3 self-start sm:self-auto">
        <ng-content />
      </div>
    </div>
  `
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null | undefined>(null);
}
