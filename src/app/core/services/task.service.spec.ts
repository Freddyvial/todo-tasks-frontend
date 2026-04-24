import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService } from './task.service';

// El environment de test es el de desarrollo: apiUrl = 'http://localhost:8080'
// Usamos endsWith para no depender del host base.
const PATH       = '/api/tasks';
const pathEnd    = (suffix = '') => (url: string) => url.endsWith(`${PATH}${suffix}`);

const mockPage = {
  content: [], page: 0, size: 10, totalElements: 0,
  totalPages: 0, first: true, last: true, empty: true,
};

const mockTask = {
  id: 1, title: 'Test', description: '',
  executionDate: '2026-04-25T10:00:00', status: 'PROGRAMMED',
  items: [], pendingExecution: true, dueNowAlert: false,
  completedItems: 0, totalItems: 0,
  createdAt: '2026-04-25T10:00:00', updatedAt: '2026-04-25T10:00:00',
};

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    service = TestBed.inject(TaskService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findAll — envía page y size como params', () => {
    service.findAll({ page: 0, size: 10 }).subscribe();
    const req = http.expectOne(r => pathEnd()(r.url));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(mockPage);
  });

  it('findAll — incluye query y status cuando se proporcionan', () => {
    service.findAll({ query: 'informe', status: 'PROGRAMMED' }).subscribe();
    const req = http.expectOne(r => pathEnd()(r.url));
    expect(req.request.params.get('query')).toBe('informe');
    expect(req.request.params.get('status')).toBe('PROGRAMMED');
    req.flush(mockPage);
  });

  it('findAll — omite el param query cuando es cadena vacía', () => {
    service.findAll({ query: '' }).subscribe();
    const req = http.expectOne(r => pathEnd()(r.url));
    expect(req.request.params.has('query')).toBe(false);
    req.flush(mockPage);
  });

  it('findAll — envía pendingOnly=true cuando está activo', () => {
    service.findAll({ pendingOnly: true }).subscribe();
    const req = http.expectOne(r => pathEnd()(r.url));
    expect(req.request.params.get('pendingOnly')).toBe('true');
    req.flush(mockPage);
  });

  it('findAll — envía dueNowOnly=true cuando está activo', () => {
    service.findAll({ dueNowOnly: true }).subscribe();
    const req = http.expectOne(r => pathEnd()(r.url));
    expect(req.request.params.get('dueNowOnly')).toBe('true');
    req.flush(mockPage);
  });

  it('getById — GET /api/tasks/:id devuelve la tarea', () => {
    service.getById(1).subscribe(t => expect(t.id).toBe(1));
    const req = http.expectOne(r => pathEnd('/1')(r.url));
    expect(req.request.method).toBe('GET');
    req.flush(mockTask);
  });

  it('create — POST /api/tasks con el body correcto', () => {
    const body = { title: 'Nueva tarea', executionDate: '2026-04-25T10:00:00', items: [] };
    service.create(body).subscribe();
    const req = http.expectOne(r => pathEnd()(r.url) && r.method === 'POST');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockTask);
  });

  it('update — PUT /api/tasks/:id con el body correcto', () => {
    const body = {
      title: 'Editada', executionDate: '2026-04-25T10:00:00',
      status: 'IN_PROGRESS' as const, items: [],
    };
    service.update(1, body).subscribe();
    const req = http.expectOne(r => pathEnd('/1')(r.url) && r.method === 'PUT');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(mockTask);
  });

  it('updateStatus — PATCH /api/tasks/:id/status con el nuevo estado', () => {
    service.updateStatus(1, 'FINISHED').subscribe();
    const req = http.expectOne(r => pathEnd('/1/status')(r.url));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'FINISHED' });
    req.flush(mockTask);
  });

  it('delete — DELETE /api/tasks/:id devuelve 204', () => {
    service.delete(1).subscribe();
    const req = http.expectOne(r => pathEnd('/1')(r.url) && r.method === 'DELETE');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('propaga el error HTTP al suscriptor', () => {
    let caught = false;
    service.getById(99).subscribe({ error: () => (caught = true) });
    http.expectOne(r => pathEnd('/99')(r.url)).flush(
      { message: 'Task with id 99 was not found' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(caught).toBe(true);
  });
});
