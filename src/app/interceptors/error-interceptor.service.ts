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
import { TranslateService } from '@ngx-translate/core';

/** Error codes emitted by SubscriptionGuardService that need an upgrade CTA. */
const SUBSCRIPTION_ERROR_CODES = new Set([
  'SUBSCRIPTION_LIMIT_EXCEEDED',
  'FAIR_USE_THROTTLED',
]);

/** Payment error codes mapped to i18n keys for Nebular toast display. */
const PAYMENT_ERROR_I18N: Record<string, string> = {
  PAYMENT_CURRENCY_UNSUPPORTED: 'payment_error_currency_unsupported',
  PAYMENT_INVALID_METHOD:       'payment_error_invalid_method',
  PAYMENT_DUPLICATE_INTENT:     'payment_error_duplicate_intent',
  PAYMENT_GATEWAY_DOWN:         'payment_error_gateway_down',
  PAYMENT_AUTH_REQUIRED:        'payment_error_auth_required',
  PAYMENT_NOT_FOUND:            'payment_error_not_found',
  PAYMENT_NOT_PERMITTED:        'payment_error_not_permitted',
  PAYMENT_VALIDATION_FAILED:    'payment_error_validation_failed',
  PAYMENT_INTERNAL_ERROR:       'payment_error_internal_error',
};

/** Shape of the limit-exceeded body returned by the backend. */
interface SubscriptionLimitBody {
  errorCode?: string;
  vector?: string;
  feature?: string;
  message?: string;
  upgradeUrl?: string;
}

@Injectable()
export class ErrorInterceptorService implements HttpInterceptor {
  constructor(
    private router: Router,
    private toaster: ToasterServices,
    private authSession: AuthSessionService,
    private auth: AuthService,
    private translate: TranslateService,
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
            const u = error.url || '';

            // ── Subscription limit / Fair-Use errors (402, 403, 429) ──────────
            if (
              (error.status === 402 || error.status === 403 || error.status === 429) &&
              errBody && typeof errBody === 'object' &&
              'errorCode' in errBody &&
              SUBSCRIPTION_ERROR_CODES.has((errBody as SubscriptionLimitBody).errorCode ?? '')
            ) {
              const body = errBody as SubscriptionLimitBody;
              const upgradeUrl = body.upgradeUrl ?? '/plans';
              const baseText = body.message ? body.message : 'Subscription limit reached.';
              const toastMessage =
                `${baseText} <a href="${upgradeUrl}" style="text-decoration:underline;font-weight:600">Upgrade Plan</a>`;
              // isHtml=true so the toaster renders the anchor instead of escaping it.
              this.toaster.warning(toastMessage, true);
              return throwError(() => error);
            }

            // ── Payment errors (PAYMENT_*) ────────────────────────────────────
            if (
              errBody && typeof errBody === 'object' &&
              'errorCode' in errBody
            ) {
              const code = (errBody as { errorCode?: string }).errorCode ?? '';
              const i18nKey = PAYMENT_ERROR_I18N[code];
              if (i18nKey) {
                const msg = this.translate.instant(i18nKey) as string;
                this.toaster.error(msg && msg !== i18nKey ? msg : code);
                return throwError(() => error);
              }
            }

            // ── Generic error display ─────────────────────────────────────────
            let display: string | undefined;
            if (errBody && typeof errBody === 'object' && 'messageCode' in errBody) {
              display = (errBody as ApiResult<unknown>).messageCode;
            } else if (typeof errBody === 'string') {
              display = errBody;
            }

            if (display) {
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
