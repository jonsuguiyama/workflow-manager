import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getTasks with no filters requests /api/tasks with no query params', () => {
    service.getTasks().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/tasks');
    expect(req.request.params.keys()).toHaveLength(0);
    req.flush([]);
  });

  it('getTasks includes priority and search as query params when provided', () => {
    service.getTasks({ priority: 'high', search: 'schema' }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === '/api/tasks' && r.params.get('priority') === 'high' && r.params.get('search') === 'schema'
    );
    req.flush([]);
  });

  it('omits a filter param entirely when not provided, rather than sending an empty value', () => {
    service.getTasks({ priority: 'low' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/tasks');
    expect(req.request.params.has('search')).toBe(false);
    expect(req.request.params.get('priority')).toBe('low');
    req.flush([]);
  });

  it('createTask posts to /api/tasks', () => {
    const payload = { title: 'x', description: '', status: 'todo', priority: 'low' };
    service.createTask(payload).subscribe();
    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('deleteTask sends DELETE to /api/tasks/:id', () => {
    service.deleteTask(42).subscribe();
    const req = httpMock.expectOne('/api/tasks/42');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('updateTaskOrders sends PUT to /api/tasks/reorder with the payload', () => {
    const payload = [{ id: 1, order: 0, status: 'todo' }];
    service.updateTaskOrders(payload).subscribe();
    const req = httpMock.expectOne('/api/tasks/reorder');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});
