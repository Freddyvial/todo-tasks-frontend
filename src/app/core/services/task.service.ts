import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskCreateRequest, TaskStatus, TaskUpdateRequest } from '../../shared/models/task.model';
import { PageResponse } from '../../shared/models/page-response.model';
import { TaskFilter } from '../../shared/models/task-filter.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/api/tasks`;
  private readonly http = inject(HttpClient);

  findAll(filter: TaskFilter): Observable<PageResponse<Task>> {
    const params = buildHttpParams(filter);
    return this.http.get<PageResponse<Task>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  create(request: TaskCreateRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, request);
  }

  update(id: number, request: TaskUpdateRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, request);
  }

  updateStatus(id: number, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

function buildHttpParams(filter: TaskFilter): HttpParams {
  let params = new HttpParams();
  if (filter.page !== undefined) params = params.set('page', filter.page);
  if (filter.size !== undefined) params = params.set('size', filter.size);
  if (filter.query)              params = params.set('query', filter.query);
  if (filter.status)             params = params.set('status', filter.status);
  if (filter.pendingOnly)        params = params.set('pendingOnly', 'true');
  if (filter.dueNowOnly)         params = params.set('dueNowOnly', 'true');
  if (filter.sort)               params = params.set('sort', filter.sort);
  return params;
}
