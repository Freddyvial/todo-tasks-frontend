import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task, TaskStatus } from '../../../../shared/models/task.model';
import { TaskStatusBadge } from '../task-status-badge/task-status-badge';
import { ElapsedTimePipe } from '../../../../shared/pipes/elapsed-time.pipe';

const TRANSITIONS: Partial<Record<TaskStatus, { value: TaskStatus; label: string; icon: string }[]>> = {
  PROGRAMMED:  [
    { value: 'IN_PROGRESS', label: 'En progreso', icon: 'play_arrow' },
    { value: 'CANCELLED',   label: 'Cancelar',    icon: 'cancel'     },
  ],
  IN_PROGRESS: [
    { value: 'FINISHED',  label: 'Finalizar', icon: 'check_circle' },
    { value: 'CANCELLED', label: 'Cancelar',  icon: 'cancel'       },
  ],
};

@Component({
  selector: 'app-task-card',
  imports: [
    DatePipe, ElapsedTimePipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatProgressBarModule, MatTooltipModule,
    TaskStatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  readonly task     = input.required<Task>();
  readonly isMobile = input(false);

  readonly edit           = output<void>();
  readonly delete         = output<void>();
  readonly statusChangeTo = output<TaskStatus>();
  readonly quickItems     = output<void>();

  readonly availableTransitions = computed(
    () => TRANSITIONS[this.task().status] ?? []
  );

  readonly showStatusOptions = signal(false);

  toggleStatusOptions(): void {
    this.showStatusOptions.update(v => !v);
  }

  selectStatus(status: TaskStatus): void {
    this.showStatusOptions.set(false);
    this.statusChangeTo.emit(status);
  }

  get progress(): number {
    const t = this.task();
    return t.totalItems > 0 ? (t.completedItems / t.totalItems) * 100 : 0;
  }
}
