import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ToasterServices } from '../shared/components/us-toaster/us-toaster.component';
import { Router } from '@angular/router';
import { AuthSessionService } from '../shared/services/auth-session.service';
import { AuthService } from '../shared/services/auth.service';
import { ApiResult } from '../models/api-result.model';

@Injectable()
export class ErrorInterceptorService implements HttpInterceptor {
  constructor(
    private router: Router,
    private toaster: ToasterServices,
    private authSession: AuthSessionService,
    private auth: AuthService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            const url = request.url || '';
            if (request.headers.get('X-Retry-After-Refresh')) {
              this.auth.clearSession();
              this.authSession.clearExpiryTimer();
              this.router.navigate(['/login']);
              return throwError(() => error);
            }
            if (
              url.includes('Auth/login') ||
              url.includes('Auth/register') ||
              url.includes('Auth/refreshToken')
            ) {
              return throwError(() => error);
            }
            return this.authSession.refreshAccessToken().pipe(
              switchMap((token) => {
                const retry = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`,
                    'X-Retry-After-Refresh': '1',
                  },
                });
                return next.handle(retry);
              }),
              catchError((refreshErr) => {
                this.auth.clearSession();
                this.authSession.clearExpiryTimer();
                this.router.navigate(['/login']);
                return throwError(() => refreshErr);
              })
            );
          }

          if (
            error.status !== 200 &&
            error.status !== 401 &&
            typeof error.error !== 'boolean'
          ) {
            const errBody = error.error;
            let display: string | undefined;
            if (errBody && typeof errBody === 'object' && 'messageCode' in errBody) {
              display = (errBody as ApiResult<unknown>).messageCode;
            } else if (typeof errBody === 'string') {
              display = errBody;
            }

            if (display) {
              const u = error.url || '';
              if (
                !u.includes('reconnectWBSDevice') &&
                !u.includes('addNewTelgramDevice') &&
                !u.includes('addNewTelegramDevice') &&
                !u.includes('reconnectTelegramDevice') &&
                !u.includes('ipapi')
              ) {
                this.toaster.error(display, true);
              }
              if ((u.includes('addNewTelgramDevice') || u.includes('addNewTelegramDevice')) && (errBody as any)?.msg) {
                this.toaster.error((errBody as any).msg, true);
              }
              if (u.includes('reconnectTelegramDevice') && (errBody as any)?.msg) {
                try {
                  this.toaster.error(JSON.parse((errBody as any).msg).msg, true);
                } catch {
                  this.toaster.error((errBody as any).msg, true);
                }
              }
            }
          }
        }
        return throwError(() => error);
      })
    );
  }
}
