import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../../../../shared/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { TaskItemForm } from '../task-item-form/task-item-form';

@Component({
  selector: 'app-task-items-quick-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    TaskItemForm,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-items-quick-dialog.html',
  styleUrl:    './task-items-quick-dialog.scss',
})
export class TaskItemsQuickDialog {
  readonly task           = inject<Task>(MAT_DIALOG_DATA);
  private readonly dialogRef   = inject(MatDialogRef<TaskItemsQuickDialog>);
  private readonly taskService = inject(TaskService);
  private readonly snackBar    = inject(MatSnackBar);

  readonly submitting = signal(false);

  readonly itemsArray = new FormArray<FormGroup>(
    this.task.items.map((item) =>
      new FormGroup({
        id:          new FormControl<number | null>(item.id ?? null),
        description: new FormControl(item.description, { nonNullable: true }),
        completed:   new FormControl(item.completed ?? false, { nonNullable: true }),
      })
    )
  );

  save(): void {
    if (this.submitting()) return;
    this.submitting.set(true);

    const items = this.itemsArray.controls.map((g, i) => ({
      id:          g.get('id')?.value ?? undefined,
      description: g.get('description')?.value as string,
      completed:   g.get('completed')?.value as boolean,
      position:    i + 1,
    }));

    const allCompleted = items.length > 0 && items.every(item => item.completed);
    const newStatus = allCompleted && this.task.status === 'IN_PROGRESS'
      ? 'FINISHED' as const
      : this.task.status;

    this.taskService.update(this.task.id, {
      title:         this.task.title,
      description:   this.task.description,
      executionDate: this.task.executionDate,
      status:        newStatus,
      items,
    }).subscribe({
      next: () => {
        const msg = newStatus === 'FINISHED'
          ? 'Tarea finalizada correctamente'
          : 'Ítems actualizados correctamente';
        this.snackBar.open(msg, 'Cerrar', { duration: 3500, panelClass: 'snack-success' });
        this.dialogRef.close(true);
      },
      error: () => this.submitting.set(false),
    });
  }
}
