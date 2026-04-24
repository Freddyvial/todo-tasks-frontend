import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TaskStatus } from '../../../../shared/models/task.model';

const STATUS_CONFIG: Record<TaskStatus, { label: string; cssClass: string }> = {
  PROGRAMMED:  { label: 'Programado',  cssClass: 'badge--programmed'  },
  IN_PROGRESS: { label: 'En progreso', cssClass: 'badge--in-progress' },
  FINISHED:    { label: 'Finalizado',  cssClass: 'badge--finished'    },
  CANCELLED:   { label: 'Cancelado',   cssClass: 'badge--cancelled'   },
};

@Component({
  selector: 'app-task-status-badge',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="status-badge"
      [ngClass]="[config().cssClass, clickable() ? 'status-badge--clickable' : '']"
      [attr.role]="clickable() ? 'button' : null"
      [attr.tabindex]="clickable() ? 0 : null"
      [attr.title]="clickable() ? 'Cambiar estado' : null">
      {{ config().label }}
      @if (clickable() && showArrow()) {
        <span class="badge-arrow" aria-hidden="true">▾</span>
      }
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 0.3px;
      border: 1px solid transparent;
      font-family: inherit;
      background: none;
      cursor: default;
      outline: none;

      &:disabled { pointer-events: none; }
    }
    .badge--programmed  { background: #e3f2fd; color: #1565c0; border-color: #90caf9; }
    .badge--in-progress { background: #fff3e0; color: #bf360c; border-color: #ffcc80; }
    .badge--finished    { background: #e8f5e9; color: #1b5e20; border-color: #a5d6a7; }
    .badge--cancelled   { background: #f5f5f5; color: #546e7a; border-color: #cfd8dc; }

    .status-badge--clickable {
      cursor: pointer;
      transition: filter 0.15s, box-shadow 0.15s;

      &:hover {
        filter: brightness(0.93);
        box-shadow: 0 1px 4px rgba(0,0,0,.12);
      }
      &:active { filter: brightness(0.86); }
    }

    .badge-arrow {
      font-size: 10px;
      line-height: 1;
      opacity: 0.75;
    }
  `],
})
export class TaskStatusBadge {
  readonly status    = input.required<TaskStatus>();
  readonly clickable = input(false);
  readonly showArrow = input(true);
  readonly config    = computed(() => STATUS_CONFIG[this.status()]);
}
