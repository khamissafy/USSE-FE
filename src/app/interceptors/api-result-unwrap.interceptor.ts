import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResult } from '../models/api-result.model';

/**
 * Unwraps successful ApiResult&lt;T&gt; bodies to <c>T</c> for JSON responses from the API.
 * Skips blob/arraybuffer and non-API URLs.
 */
@Injectable()
export class ApiResultUnwrapInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.responseType === 'blob' || req.responseType === 'arraybuffer') {
      return next.handle(req);
    }
    if (!req.url.includes(environment.api) && !req.url.startsWith('/api/')) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      map((event) => {
        if (!(event instanceof HttpResponse)) {
          return event;
        }
        const body = event.body as unknown;
        if (
          body &&
          typeof body === 'object' &&
          'status' in body &&
          typeof (body as ApiResult<unknown>).status === 'boolean' &&
          'data' in body &&
          (body as ApiResult<unknown>).status === true
        ) {
          const r = body as ApiResult<unknown>;
          return event.clone({ body: r.data });
        }
        return event;
      })
    );
  }
}
