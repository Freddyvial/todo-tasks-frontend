import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { TaskFormDialog, TaskFormDialogData } from './task-form-dialog';
import { TaskService } from '../../../../core/services/task.service';
import { Task } from '../../../../shared/models/task.model';

const mockTask: Task = {
  id: 1,
  title: 'Tarea existente',
  description: 'Descripción',
  executionDate: '2026-04-25T10:00:00',
  status: 'PROGRAMMED',
  items: [{ id: 10, description: 'Ítem 1', completed: false, position: 1 }],
  pendingExecution: true,
  dueNowAlert: false,
  completedItems: 0,
  totalItems: 1,
  createdAt: '2026-04-25T08:00:00',
  updatedAt: '2026-04-25T08:00:00',
};

async function buildFixture(
  data: TaskFormDialogData,
  taskServiceOverrides: Partial<TaskService> = {},
): Promise<{
  fixture: ComponentFixture<TaskFormDialog>;
  component: TaskFormDialog;
  dialogRefMock: { close: ReturnType<typeof vi.fn> };
  taskServiceMock: Partial<TaskService>;
}> {
  TestBed.resetTestingModule();

  const dialogRefMock  = { close: vi.fn() };
  const snackBarMock   = { open: vi.fn() };
  const matDialogMock  = { open: vi.fn() };
  const taskServiceMock: Partial<TaskService> = {
    create: vi.fn().mockReturnValue(of(mockTask)),
    update: vi.fn().mockReturnValue(of(mockTask)),
    ...taskServiceOverrides,
  };

  await TestBed.configureTestingModule({
    imports: [TaskFormDialog, NoopAnimationsModule],
    providers: [
      { provide: MAT_DIALOG_DATA,  useValue: data           },
      { provide: MatDialogRef,     useValue: dialogRefMock  },
      { provide: TaskService,      useValue: taskServiceMock },
      { provide: MatSnackBar,      useValue: snackBarMock   },
      { provide: MatDialog,        useValue: matDialogMock  },
    ],
  }).compileComponents();

  const fixture   = TestBed.createComponent(TaskFormDialog);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, dialogRefMock, taskServiceMock };
}

// ─── Modo CREATE ────────────────────────────────────────────────────────────

describe('TaskFormDialog — modo create', () => {
  let fixture:        ComponentFixture<TaskFormDialog>;
  let component:      TaskFormDialog;
  let dialogRefMock:  { close: ReturnType<typeof vi.fn> };
  let taskServiceMock: Partial<TaskService>;

  beforeEach(async () => {
    ({ fixture, component, dialogRefMock, taskServiceMock } =
      await buildFixture({ mode: 'create' }));
  });

  it('el formulario es inválido al inicio', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('title — muestra error "required" cuando está vacío y fue tocado', () => {
    const ctrl = component.form.get('title')!;
    ctrl.markAsTouched();
    expect(ctrl.hasError('required')).toBe(true);
    expect(component.getFieldError('title')).toBe('Este campo es obligatorio.');
  });

  it('title — muestra error "minlength" con menos de 3 caracteres', () => {
    const ctrl = component.form.get('title')!;
    ctrl.setValue('ab');
    ctrl.markAsTouched();
    expect(ctrl.hasError('minlength')).toBe(true);
    expect(component.getFieldError('title')).toContain('Mínimo');
  });

  it('executionDate — muestra error "required" cuando no se elige fecha', () => {
    const ctrl = component.form.get('executionDate')!;
    ctrl.markAsTouched();
    expect(ctrl.hasError('required')).toBe(true);
    expect(component.getFieldError('executionDate')).toBe('Este campo es obligatorio.');
  });

  it('getFieldError — devuelve null si el control no fue tocado', () => {
    expect(component.getFieldError('title')).toBeNull();
  });

  it('itemsArray — push incrementa la longitud en 1', () => {
    const antes = component.itemsArray.length;
    component.itemsArray.push(new FormGroup({
      id:          new FormControl(null),
      description: new FormControl('Nuevo ítem'),
      completed:   new FormControl(false),
    }));
    expect(component.itemsArray.length).toBe(antes + 1);
  });

  it('itemsArray — removeAt decrementa la longitud en 1', () => {
    component.itemsArray.push(new FormGroup({
      id:          new FormControl(null),
      description: new FormControl('Ítem a eliminar'),
      completed:   new FormControl(false),
    }));
    const antes = component.itemsArray.length;
    component.itemsArray.removeAt(0);
    expect(component.itemsArray.length).toBe(antes - 1);
  });

  it('submit — no llama a create si el formulario es inválido', async () => {
    await component.submit();
    expect(taskServiceMock.create).not.toHaveBeenCalled();
  });

  it('submit — llama a TaskService.create con formulario válido y cierra el dialog', async () => {
    component.form.patchValue({
      title:           'Tarea válida',
      executionDate:   new Date('2026-04-25'),
      executionHour:   '10',
      executionMinute: '00',
      executionAmPm:   'AM',
      status:          'PROGRAMMED',
    });

    await component.submit();

    expect(taskServiceMock.create).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});

// ─── Modo EDIT ───────────────────────────────────────────────────────────────

describe('TaskFormDialog — modo edit', () => {
  let component:      TaskFormDialog;
  let dialogRefMock:  { close: ReturnType<typeof vi.fn> };
  let taskServiceMock: Partial<TaskService>;

  beforeEach(async () => {
    ({ component, dialogRefMock, taskServiceMock } =
      await buildFixture({ mode: 'edit', task: mockTask }));
  });

  it('precarga el título de la tarea en el formulario', () => {
    expect(component.form.get('title')?.value).toBe(mockTask.title);
  });

  it('precarga los ítems existentes en el FormArray', () => {
    expect(component.itemsArray.length).toBe(mockTask.items.length);
  });

  it('submit — llama a TaskService.update con formulario válido y cierra el dialog', async () => {
    component.form.patchValue({
      title:           'Título editado',
      executionDate:   new Date('2026-04-25'),
      executionHour:   '10',
      executionMinute: '00',
      executionAmPm:   'AM',
      status:          'IN_PROGRESS',
    });

    await component.submit();

    expect(taskServiceMock.update).toHaveBeenCalledWith(
      mockTask.id,
      expect.objectContaining({ title: 'Título editado', status: 'IN_PROGRESS' }),
    );
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});
