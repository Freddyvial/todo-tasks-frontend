import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEs, 'es');
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { TaskList } from './task-list';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../shared/models/task.model';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { PageEvent } from '@angular/material/paginator';

const mockTask: Task = {
  id: 1,
  title: 'Tarea de prueba',
  description: 'Descripción',
  executionDate: '2026-04-25T10:00:00',
  status: 'PROGRAMMED',
  items: [],
  pendingExecution: true,
  dueNowAlert: false,
  completedItems: 0,
  totalItems: 0,
  createdAt: '2026-04-25T08:00:00',
  updatedAt: '2026-04-25T08:00:00',
};

function buildPageResponse(tasks: Task[], total = tasks.length): PageResponse<Task> {
  return {
    content: tasks,
    page: 0, size: 10,
    totalElements: total, totalPages: Math.ceil(total / 10),
    first: true, last: true, empty: tasks.length === 0,
  };
}

describe('TaskList', () => {
  let fixture:        ComponentFixture<TaskList>;
  let component:      TaskList;
  let findAllSpy:     ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findAllSpy = vi.fn().mockReturnValue(of(buildPageResponse([mockTask], 1)));

    await TestBed.configureTestingModule({
      imports: [TaskList, NoopAnimationsModule],
      providers: [
        { provide: LOCALE_ID, useValue: 'es' },
        {
          provide: TaskService,
          useValue: { findAll: findAllSpy, delete: vi.fn(), updateStatus: vi.fn() },
        },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: vi.fn() },
        },
        {
          provide: BreakpointObserver,
          useValue: { observe: vi.fn().mockReturnValue(of({ matches: false, breakpoints: {} })) },
        },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(TaskList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('llama a TaskService.findAll en ngOnInit', () => {
    expect(findAllSpy).toHaveBeenCalled();
  });

  it('el signal loading queda en false tras una carga exitosa', () => {
    expect(component.loading()).toBe(false);
  });

  it('el signal tasks se llena con el contenido de la respuesta', () => {
    expect(component.tasks().length).toBe(1);
    expect(component.tasks()[0].id).toBe(mockTask.id);
  });

  it('el signal totalElements refleja el total de la respuesta', () => {
    expect(component.totalElements()).toBe(1);
  });

  it('onFilterChange dispara una nueva llamada a findAll con el filtro aplicado', () => {
    const calls = findAllSpy.mock.calls.length;
    component.onFilterChange({ query: 'informe' });
    expect(findAllSpy.mock.calls.length).toBe(calls + 1);
    const lastArg = findAllSpy.mock.calls.at(-1)?.[0];
    expect(lastArg?.query).toBe('informe');
  });

  it('onFilterChange resetea la página a 0', () => {
    component.onPageChange({ pageIndex: 2, pageSize: 10, length: 30 } as PageEvent);
    expect(component.currentPage()).toBe(2);
    component.onFilterChange({ query: 'reset' });
    expect(component.currentPage()).toBe(0);
  });

  it('onPageChange actualiza currentPage y pageSize y dispara reload', () => {
    const calls = findAllSpy.mock.calls.length;
    component.onPageChange({ pageIndex: 1, pageSize: 5, length: 20 } as PageEvent);
    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(5);
    expect(findAllSpy.mock.calls.length).toBe(calls + 1);
  });

  it('tasks vacío cuando la API devuelve lista vacía', async () => {
    findAllSpy.mockReturnValue(of(buildPageResponse([])));
    component.onFilterChange({});
    await fixture.whenStable();
    expect(component.tasks().length).toBe(0);
    expect(component.totalElements()).toBe(0);
  });
});
