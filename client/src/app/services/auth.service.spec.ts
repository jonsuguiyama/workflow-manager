import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loginAsDemo posts to /api/auth/demo with credentials', () => {
    service.loginAsDemo().subscribe();

    const req = httpMock.expectOne('/api/auth/demo');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ user: { id: 1, email: 'demo@workflow.com', role: 'user' } });
  });

  it('checkSession resolves true when the API reports authenticated', () => {
    let result: boolean | undefined;
    service.checkSession().subscribe((value) => (result = value));

    const req = httpMock.expectOne('/api/auth/me');
    req.flush({ authenticated: true });

    expect(result).toBe(true);
  });

  it('checkSession resolves false (not an error) when the request fails', () => {
    let result: boolean | undefined;
    service.checkSession().subscribe((value) => (result = value));

    const req = httpMock.expectOne('/api/auth/me');
    req.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(result).toBe(false);
  });

  it('logout posts to /api/auth/logout', () => {
    service.logout().subscribe();

    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true });
  });
});
