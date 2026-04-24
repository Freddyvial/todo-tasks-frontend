import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TaskFilter } from '../../../../shared/models/task-filter.model';
import { TaskStatus } from '../../../../shared/models/task.model';

@Component({
  selector: 'app-task-filter-bar',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-filter-bar.html',
  styleUrl: './task-filter-bar.scss',
})
export class TaskFilterBar implements OnInit {
  readonly isMobile   = input(false);
  readonly filterChange = output<TaskFilter>();

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<TaskStatus | null>(null);
  readonly pendingOnly   = signal(false);
  readonly alertOnly     = signal(false);
  readonly filtersExpanded = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  readonly statuses: { value: TaskStatus; label: string }[] = [
    { value: 'PROGRAMMED',  label: 'Programado'  },
    { value: 'IN_PROGRESS', label: 'En progreso' },
    { value: 'FINISHED',    label: 'Finalizado'  },
    { value: 'CANCELLED',   label: 'Cancelado'   },
  ];

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.emit());

    this.statusControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.emit());
  }

  togglePending(): void {
    this.pendingOnly.set(!this.pendingOnly());
    if (this.pendingOnly()) this.alertOnly.set(false);
    this.emit();
  }

  toggleAlert(): void {
    this.alertOnly.set(!this.alertOnly());
    if (this.alertOnly()) this.pendingOnly.set(false);
    this.emit();
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue(null, { emitEvent: false });
    this.pendingOnly.set(false);
    this.alertOnly.set(false);
    this.emit();
  }

  private emit(): void {
    this.filterChange.emit({
      query:       this.searchControl.value || undefined,
      status:      this.statusControl.value  || undefined,
      pendingOnly: this.pendingOnly() || undefined,
      dueNowOnly:  this.alertOnly()   || undefined,
    });
  }
}
