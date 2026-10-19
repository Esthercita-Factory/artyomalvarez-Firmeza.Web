import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span class="badge-status {{ cls() }}">
      <ng-content />
    </span>
  `
})
export class BadgeComponent {
  readonly cls = input<string>('status-neutral');
}
