import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface AuthResponse {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  loginAsDemo(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/demo`, {}, { withCredentials: true });
  }

  checkSession(): Observable<boolean> {
    return this.http.get<{ authenticated: boolean }>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      map(res => res.authenticated),
      catchError(() => of(false))
    );
  }
}
