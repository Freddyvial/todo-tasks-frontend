import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
  OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { Task, TaskStatus } from '../../../../shared/models/task.model';
import { TaskFilter } from '../../../../shared/models/task-filter.model';
import { TaskService } from '../../../../core/services/task.service';
import { TaskFilterBar } from '../task-filter-bar/task-filter-bar';
import { TaskCard } from '../task-card/task-card';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-task-list',
  imports: [
    MatButtonModule, MatIconModule, MatPaginatorModule,
    TaskFilterBar, TaskCard, LoadingSpinner, EmptyState,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly dialog      = inject(MatDialog);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly snackBar    = inject(MatSnackBar);

  readonly isMobile = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.XSmall)
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  readonly tasks         = signal<Task[]>([]);
  readonly totalElements = signal(0);
  readonly loading       = signal(false);
  readonly currentPage   = signal(0);
  readonly pageSize      = signal(10);

  private currentFilter: TaskFilter = {};

  ngOnInit(): void {
    this.load(this.currentFilter);
  }

  onFilterChange(filter: TaskFilter): void {
    this.currentFilter = filter;
    this.currentPage.set(0);
    this.load(filter);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load(this.currentFilter);
  }

  async openCreateDialog(): Promise<void> {
    const { TaskFormDialog } = await import('../task-form-dialog/task-form-dialog');
    const ref = this.dialog.open(TaskFormDialog, {
      width: this.isMobile() ? '100vw' : '680px',
      maxWidth: '100vw',
      data: { mode: 'create' },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ok) => {
      if (ok) this.load(this.currentFilter);
    });
  }

  async openEditDialog(task: Task): Promise<void> {
    const { TaskFormDialog } = await import('../task-form-dialog/task-form-dialog');
    const ref = this.dialog.open(TaskFormDialog, {
      width: this.isMobile() ? '100vw' : '620px',
      maxWidth: '100vw',
      data: { mode: 'edit', task },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ok) => {
      if (ok) this.load(this.currentFilter);
    });
  }

  async handleStatusChange(task: Task, newStatus: TaskStatus): Promise<void> {
    // Validación: no se puede finalizar si hay ítems pendientes
    if (newStatus === 'FINISHED' && task.totalItems > 0 && task.completedItems < task.totalItems) {
      const pending = task.totalItems - task.completedItems;
      this.snackBar.open(
        `Hay ${pending} ítem${pending > 1 ? 's' : ''} sin completar. Márcalos como realizados antes de finalizar la tarea.`,
        'Entendido',
        { duration: 6000, panelClass: 'snack-warning' },
      );
      return;
    }

    if (newStatus === 'CANCELLED') {
      const { ConfirmDialog } = await import('../../../../shared/components/confirm-dialog/confirm-dialog');
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title:        'Cancelar tarea',
          message:      `¿Seguro que deseas cancelar "${task.title}"? Esta acción no se puede deshacer.`,
          confirmLabel: 'Sí, cancelar',
          confirmColor: 'warn',
        },
      });
      ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
        if (confirmed) this.applyStatusChange(task, newStatus);
      });
    } else {
      this.applyStatusChange(task, newStatus);
    }
  }

  private applyStatusChange(task: Task, newStatus: TaskStatus): void {
    this.taskService.updateStatus(task.id, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Estado actualizado correctamente', 'Cerrar',
            { duration: 3500, panelClass: 'snack-success' });
          this.load(this.currentFilter);
        },
        error: () => { /* interceptor ya mostró el mensaje del servidor */ },
      });
  }

  async openItemsDialog(task: Task): Promise<void> {
    const { TaskItemsQuickDialog } = await import('../task-items-quick-dialog/task-items-quick-dialog');
    const ref = this.dialog.open(TaskItemsQuickDialog, {
      width: this.isMobile() ? '100vw' : '680px',
      maxWidth: '100vw',
      data: task,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ok) => {
      if (ok) this.load(this.currentFilter);
    });
  }

  async openDeleteDialog(task: Task): Promise<void> {
    const { ConfirmDialog } = await import('../../../../shared/components/confirm-dialog/confirm-dialog');
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title:        'Eliminar tarea',
        message:      `¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmColor: 'warn',
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (confirmed) {
        this.taskService.delete(task.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Tarea eliminada correctamente', 'Cerrar',
                { duration: 3500, panelClass: 'snack-success' });
              this.load(this.currentFilter);
            },
            error: () => { /* interceptor ya mostró el mensaje del servidor */ },
          });
      }
    });
  }

  private load(filter: TaskFilter): void {
    this.loading.set(true);
    this.taskService.findAll({
      ...filter,
      page: this.currentPage(),
      size: this.pageSize(),
      sort: 'executionDate,asc',
    }).pipe(
      catchError(() => of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((page) => {
      if (page) {
        this.tasks.set(page.content);
        this.totalElements.set(page.totalElements);
      }
      this.loading.set(false);
    });
  }
}
