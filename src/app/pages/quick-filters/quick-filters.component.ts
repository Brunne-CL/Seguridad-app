import { Component, input, output } from '@angular/core';

export type QuickFilterValue = 'all' | 'mine' | 'unassigned' | 'high';

@Component({
  selector: 'app-quick-filters',
  standalone: true,
  templateUrl: './quick-filters.component.html',
  styleUrl: './quick-filters.component.scss',
})
export class QuickFiltersComponent {
  activeFilter = input<QuickFilterValue>('all');
  filterChange = output<QuickFilterValue>();

  filters: { value: QuickFilterValue; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'mine', label: 'Mis tickets' },
    { value: 'unassigned', label: 'Sin asignar' },
    { value: 'high', label: 'Prioridad alta' },
  ];

  select(f: QuickFilterValue): void {
    this.filterChange.emit(f);
  }
}
