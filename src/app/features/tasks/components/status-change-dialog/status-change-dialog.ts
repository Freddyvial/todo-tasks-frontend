import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task, TaskStatus } from '../../../../shared/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { TaskStatusBadge } from '../task-status-badge/task-status-badge';

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PROGRAMMED:  ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['FINISHED',    'CANCELLED'],
  FINISHED:    [],
  CANCELLED:   [],
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  PROGRAMMED:  'Programado',
  IN_PROGRESS: 'En progreso',
  FINISHED:    'Finalizado',
  CANCELLED:   'Cancelado',
};

@Component({
  selector: 'app-status-change-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TaskStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-change-dialog.html',
  styleUrl: './status-change-dialog.scss',
})
export class StatusChangeDialog {
  readonly data        = inject<{ task: Task }>(MAT_DIALOG_DATA);
  readonly dialogRef   = inject(MatDialogRef<StatusChangeDialog>);
  private readonly taskService = inject(TaskService);
  private readonly snackBar    = inject(MatSnackBar);

  readonly submitting      = signal(false);
  readonly selectedStatus  = signal<TaskStatus | null>(null);
  readonly confirming      = computed(() => this.selectedStatus() !== null);

  readonly transitions = TRANSITIONS[this.data.task.status];
  readonly statusLabel = STATUS_LABEL;

  selectStatus(status: TaskStatus): void {
    this.selectedStatus.set(status);
  }

  cancelSelection(): void {
    this.selectedStatus.set(null);
  }

  confirmChange(): void {
    const newStatus = this.selectedStatus();
    if (!newStatus || this.submitting()) return;
    this.submitting.set(true);
    this.taskService.updateStatus(this.data.task.id, newStatus).subscribe({
      next: () => {
        this.snackBar.open('Estado actualizado correctamente', 'Cerrar',
          { duration: 3500, panelClass: 'snack-success' });
        this.dialogRef.close(true);
      },
      error: () => {
        this.submitting.set(false);
        this.selectedStatus.set(null);
      },
    });
  }
}
