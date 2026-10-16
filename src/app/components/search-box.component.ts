import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  template: `
    <div class="relative min-w-[240px] flex-1">
      <span
        class="material-symbols-outlined absolute left-3 top-2.5 text-secondary-label text-[20px] pointer-events-none"
      >
        search
      </span>
      <input
        type="text"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
        [placeholder]="placeholder()"
        class="w-full h-10 pl-9 pr-3 bg-white institutional-border rounded-xl text-carbon text-body-sm focus:border-carbon focus:outline-none"
      />
    </div>
  `
})
export class SearchBoxComponent {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Buscar...');
}
