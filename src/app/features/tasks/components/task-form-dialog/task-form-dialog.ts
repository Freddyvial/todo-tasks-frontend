import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Task, TaskCreateRequest, TaskStatus, TaskUpdateRequest } from '../../../../shared/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { TaskItemForm } from '../task-item-form/task-item-form';

export interface TaskFormDialogData {
  mode: 'create' | 'edit';
  task?: Task;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Convierte un Date a partes 12h: { hour:'10', minute:'30', ampm:'AM' } */
function toTimeParts12h(d: Date): { executionHour: string; executionMinute: string; executionAmPm: 'AM' | 'PM' } {
  const h = d.getHours();
  return {
    executionHour:   String(h % 12 || 12),
    executionMinute: pad2(d.getMinutes()),
    executionAmPm:   h >= 12 ? 'PM' : 'AM',
  };
}

/** Combina fecha + partes 12h en el ISO que espera el backend ("2026-04-22T10:30:00") */
function buildIso(date: Date, hour12: string, minute: string, ampm: 'AM' | 'PM'): string {
  let h = parseInt(hour12, 10);
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(h)}:${minute}:00`;
}

const FINAL_STATUSES: TaskStatus[] = ['FINISHED', 'CANCELLED'];

@Component({
  selector: 'app-task-form-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule,
    TaskItemForm,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
})
export class TaskFormDialog implements OnInit {
  readonly data      = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<TaskFormDialog>);
  private readonly taskService  = inject(TaskService);
  private readonly snackBar     = inject(MatSnackBar);
  private readonly matDialog    = inject(MatDialog);
  private readonly destroyRef   = inject(DestroyRef);

  readonly submitting = signal(false);

  readonly hours   = Array.from({ length: 12 }, (_, i) => String(i + 1));   // ['1'..'12']
  readonly minutes = Array.from({ length: 60 }, (_, i) => pad2(i));          // ['00'..'59']

  private static readonly ALL_STATUSES: { value: TaskStatus; label: string }[] = [
    { value: 'PROGRAMMED',  label: 'Programado'  },
    { value: 'IN_PROGRESS', label: 'En progreso' },
    { value: 'FINISHED',    label: 'Finalizado'  },
    { value: 'CANCELLED',   label: 'Cancelado'   },
  ];

  private static readonly ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    PROGRAMMED:  ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['FINISHED',    'CANCELLED'],
    FINISHED:    [],
    CANCELLED:   [],
  };

  /** Estados disponibles en el select de edición según el estado actual de la tarea. */
  get statuses(): { value: TaskStatus; label: string }[] {
    const current = this.data.task?.status;
    if (!current) return TaskFormDialog.ALL_STATUSES;
    const allowed = TaskFormDialog.ALLOWED_TRANSITIONS[current] ?? [];
    return TaskFormDialog.ALL_STATUSES.filter(
      s => s.value === current || allowed.includes(s.value)
    );
  }

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    }),
    description: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(1000)],
    }),
    executionDate: new FormControl<Date | null>(null, {
      validators: [Validators.required],
    }),
    executionHour:  new FormControl('12', { nonNullable: true, validators: [Validators.required] }),
    executionMinute: new FormControl('00', { nonNullable: true, validators: [Validators.required] }),
    executionAmPm:  new FormControl<'AM' | 'PM'>('PM', { nonNullable: true }),
    status: new FormControl<TaskStatus>('PROGRAMMED', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    items: new FormArray<FormGroup>([]),
  });

  get isEdit(): boolean   { return this.data.mode === 'edit'; }
  get itemsArray(): FormArray<FormGroup> { return this.form.get('items') as FormArray<FormGroup>; }

  readonly minDate: Date | null = this.data.mode === 'create' ? new Date() : null;

  get readonly(): boolean {
    return this.isEdit && FINAL_STATUSES.includes(this.data.task?.status as TaskStatus);
  }

  get dialogTitle(): string {
    if (!this.isEdit) return 'Nueva tarea';
    return this.readonly ? 'Ver tarea' : 'Editar tarea';
  }

  get titleIcon(): string {
    if (!this.isEdit) return 'add_task';
    return this.readonly ? 'visibility' : 'edit';
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.task) {
      const t = this.data.task;
      const d = new Date(t.executionDate);
      this.form.patchValue({
        title:       t.title,
        description: t.description ?? null,
        executionDate: d,
        ...toTimeParts12h(d),
        status: t.status,
      });
      t.items.forEach((item) =>
        this.itemsArray.push(this.buildItemGroup(item.id, item.description, item.completed ?? false))
      );
      if (this.readonly) {
        this.form.disable();
      }
    }
  }

  getFieldError(field: string): string | null {
    const ctrl: AbstractControl | null = this.form.get(field);
    if (!ctrl?.touched || !ctrl.errors) return null;
    if (ctrl.errors['required'])           return 'Este campo es obligatorio.';
    if (ctrl.errors['minlength'])          return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres.`;
    if (ctrl.errors['maxlength'])          return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    if (ctrl.errors['matDatepickerParse']) return 'Fecha inválida.';
    return 'Valor inválido.';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const v = this.form.getRawValue();

    if (this.isEdit && v.status === 'FINISHED') {
      const pending = this.itemsArray.controls.filter(g => !g.get('completed')?.value).length;
      if (pending > 0) {
        this.snackBar.open(
          `Hay ${pending} ítem${pending > 1 ? 's' : ''} sin completar. Márcalos como realizados antes de finalizar la tarea.`,
          'Entendido',
          { duration: 6000, panelClass: 'snack-warning' },
        );
        return;
      }
    }

    if (this.isEdit && v.status === 'CANCELLED') {
      const { ConfirmDialog } = await import('../../../../shared/components/confirm-dialog/confirm-dialog');
      const ref = this.matDialog.open(ConfirmDialog, {
        data: {
          title:        'Cancelar tarea',
          message:      `¿Seguro que deseas cancelar "${this.data.task!.title}"? Esta acción no se puede deshacer.`,
          confirmLabel: 'Sí, cancelar',
          confirmColor: 'warn',
        },
        width: '360px',
      });
      ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
        if (confirmed) this.performSave(v);
      });
      return;
    }

    this.performSave(v);
  }

  private performSave(v: ReturnType<typeof this.form.getRawValue>): void {
    this.submitting.set(true);
    const executionDate = buildIso(
      v.executionDate as Date,
      v.executionHour,
      v.executionMinute,
      v.executionAmPm,
    );
    const items = this.itemsArray.controls.map((g, i) => ({
      id:          g.get('id')?.value ?? undefined,
      description: g.get('description')?.value as string,
      completed:   g.get('completed')?.value as boolean,
      position:    i + 1,
    }));

    const call$ = this.isEdit
      ? this.taskService.update(this.data.task!.id, {
          title: v.title, description: v.description ?? undefined,
          executionDate, status: v.status, items,
        } satisfies TaskUpdateRequest)
      : this.taskService.create({
          title: v.title, description: v.description ?? undefined,
          executionDate, items,
        } satisfies TaskCreateRequest);

    const successMsg = this.isEdit ? 'Tarea actualizada correctamente' : 'Tarea creada correctamente';

    call$.subscribe({
      next: () => {
        this.snackBar.open(successMsg, 'Cerrar', { duration: 3500, panelClass: 'snack-success' });
        this.dialogRef.close(true);
      },
      error: () => this.submitting.set(false),
    });
  }

  private buildItemGroup(id?: number, description = '', completed = false): FormGroup {
    return new FormGroup({
      id:          new FormControl<number | null>(id ?? null),
      description: new FormControl(description, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(250)],
      }),
      completed: new FormControl(completed, { nonNullable: true }),
    });
  }
}
