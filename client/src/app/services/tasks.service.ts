import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at?: string;
}

export type CreateTaskPayload = Omit<Task, 'id' | 'created_at'>;
export type UpdateTaskPayload = Partial<Task>;

export interface TaskFilters {
  priority?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly apiUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  getTasks(filters?: TaskFilters): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params });
  }

  createTask(task: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(id: number, task: UpdateTaskPayload): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task);
  }

  updateTaskStatus(id: number, status: string): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}/status`, { status });
  }

  updateTaskOrders(payload: { id: number; order: number; status: string }[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/reorder`, payload);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${id}`);
  }
}
