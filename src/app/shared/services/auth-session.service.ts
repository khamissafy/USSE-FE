import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResult } from 'src/app/models/api-result.model';
import { AuthService } from './auth.service';

/** Login/register response shape after unwrap is disabled for plainHttp — use raw ApiResult here. */
interface AuthPayload {
  token: string;
  refreshToken?: string;
  email?: string;
}

/**
 * Refresh without going through interceptors (avoids 401 loops). Uses cookies for refresh token.
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly plainHttp: HttpClient;
  private refreshInFlight$: Observable<string> | null = null;
  private expTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(httpBackend: HttpBackend, private auth: AuthService) {
    this.plainHttp = new HttpClient(httpBackend);
  }

  /** POST /Auth/refreshToken — raw ApiResult body (no unwrap interceptor). */
  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    this.refreshInFlight$ = this.plainHttp
      .post<ApiResult<AuthPayload>>(`${environment.api}Auth/refreshToken`, {})
      .pipe(
        map((body) => {
          if (!body?.status || !body.data?.token) {
            throw new Error(body?.messageCode || 'REFRESH_FAILED');
          }
          const token = body.data.token;
          this.auth.setAccessToken(token);
          const email = decodeJwtEmail(token);
          if (email) {
            localStorage.setItem('email', email);
          }
          const role = decodeJwtRole(token);
          if (role) {
            localStorage.setItem('role', role);
          }
          this.scheduleRefreshBeforeExpiry(token);
          return token;
        }),
        catchError((err) => {
          this.auth.clearSession();
          throw err;
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1)
      );
    return this.refreshInFlight$;
  }

  /** On app load: restore session from HttpOnly refresh cookie. */
  tryRestoreSession(): Observable<boolean> {
    return this.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  scheduleRefreshBeforeExpiry(accessToken: string): void {
    if (this.expTimer) {
      clearTimeout(this.expTimer);
      this.expTimer = null;
    }
    const expMs = getJwtExpMs(accessToken);
    if (!expMs) {
      return;
    }
    const refreshAt = Math.max(expMs - 60_000, Date.now() + 5_000);
    const delay = refreshAt - Date.now();
    if (delay <= 0) {
      this.refreshAccessToken().subscribe({ error: () => {} });
      return;
    }
    this.expTimer = setTimeout(() => {
      this.refreshAccessToken().subscribe({ error: () => {} });
    }, delay);
  }

  clearExpiryTimer(): void {
    if (this.expTimer) {
      clearTimeout(this.expTimer);
      this.expTimer = null;
    }
  }
}

function decodeJwtEmail(token: string): string | null {
  try {
    const payload = parseJwtPayload(token);
    return (payload['email'] as string) || (payload['Email'] as string) || null;
  } catch {
    return null;
  }
}

function decodeJwtRole(token: string): string | null {
  try {
    const payload = parseJwtPayload(token);
    const roles = payload['roles'] ?? payload['role'];
    if (typeof roles === 'string') {
      return roles;
    }
    return null;
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('invalid jwt');
  }
  const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json) as Record<string, unknown>;
}

function getJwtExpMs(token: string): number | null {
  try {
    const payload = parseJwtPayload(token);
    const exp = payload['exp'];
    if (typeof exp === 'number') {
      return exp * 1000;
    }
    return null;
  } catch {
    return null;
  }
}
