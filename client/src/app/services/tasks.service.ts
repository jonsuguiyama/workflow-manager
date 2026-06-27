import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly apiUrl = '';

  constructor(private readonly http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
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
