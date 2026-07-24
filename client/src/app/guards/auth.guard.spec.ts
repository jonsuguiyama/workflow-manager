import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { isObservable, of, throwError, firstValueFrom } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

async function runGuard(url: string) {
  const result = TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
  );
  return isObservable(result) ? firstValueFrom(result) : result;
}

describe('authGuard', () => {
  let authServiceSpy: { checkSession: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceSpy = { checkSession: vi.fn() };
    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('always allows navigation to /login without checking the session', async () => {
    const result = await runGuard('/login');
    expect(result).toBe(true);
    expect(authServiceSpy.checkSession).not.toHaveBeenCalled();
  });

  it('allows navigation to a protected route when the session is valid', async () => {
    authServiceSpy.checkSession.mockReturnValue(of(true));
    const result = await runGuard('/tasks');
    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /login and denies access when there is no valid session', async () => {
    authServiceSpy.checkSession.mockReturnValue(of(false));
    const result = await runGuard('/tasks');
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirects to /login and denies access if the session check errors', async () => {
    authServiceSpy.checkSession.mockReturnValue(throwError(() => new Error('network error')));
    const result = await runGuard('/tasks');
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
