import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskStatusBadge } from './task-status-badge';
import { TaskStatus } from '../../../../shared/models/task.model';

describe('TaskStatusBadge', () => {
  let fixture: ComponentFixture<TaskStatusBadge>;
  let host: HTMLElement;

  async function setup(status: TaskStatus, clickable = false): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TaskStatusBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskStatusBadge);
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('clickable', clickable);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  const CASES: { status: TaskStatus; label: string; cssClass: string }[] = [
    { status: 'PROGRAMMED',  label: 'Programado',  cssClass: 'badge--programmed'  },
    { status: 'IN_PROGRESS', label: 'En progreso', cssClass: 'badge--in-progress' },
    { status: 'FINISHED',    label: 'Finalizado',  cssClass: 'badge--finished'    },
    { status: 'CANCELLED',   label: 'Cancelado',   cssClass: 'badge--cancelled'   },
  ];

  CASES.forEach(({ status, label, cssClass }) => {
    it(`${status} — muestra "${label}" y aplica la clase ${cssClass}`, async () => {
      await setup(status);
      const badge = host.querySelector('.status-badge') as HTMLElement;
      expect(badge.textContent?.trim()).toContain(label);
      expect(badge.classList).toContain(cssClass);
    });
  });

  it('aplica la clase status-badge--clickable cuando clickable es true', async () => {
    await setup('PROGRAMMED', true);
    expect(host.querySelector('.status-badge--clickable')).toBeTruthy();
  });

  it('no aplica la clase status-badge--clickable cuando clickable es false', async () => {
    await setup('PROGRAMMED', false);
    expect(host.querySelector('.status-badge--clickable')).toBeNull();
  });
});
