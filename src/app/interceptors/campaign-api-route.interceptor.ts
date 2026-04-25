import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Rewrites mistaken /api/.../Message/... campaign routes to CampaignController.
 * Backend exposes these only under api/Campaign (see CampaignController).
 */
@Injectable()
export class CampaignApiRouteInterceptor implements HttpInterceptor {
  private static readonly REPLACEMENTS: [string, string][] = [
    ['/Message/listCampaigns', '/Campaign/listCampaigns'],
    ['/Message/listCampaignsCount', '/Campaign/listCampaignsCount'],
    ['/Message/createWhatsappBusinessCampaign', '/Campaign/createWhatsappBusinessCampaign'],
    ['/Message/stopWhatsappBusinessCampaign', '/Campaign/stopWhatsappBusinessCampaign'],
    ['/Message/deleteWhatsappBusinessCampaign', '/Campaign/deleteWhatsappBusinessCampaign'],
    ['/Message/getCampaignById', '/Campaign/getCampaignById'],
    ['/Message/getLastCampaign', '/Campaign/getLastCampaign'],
    ['/Message/getCampaignStat', '/Campaign/getCampaignStat'],
    ['/Message/listCampaignMessages', '/Campaign/listCampaignMessages'],
    ['/Message/listCampaignMessagesCount', '/Campaign/listCampaignMessagesCount'],
    ['/Message/resendCampaignFailedMessages', '/Campaign/resendCampaignFailedMessages'],
  ];

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    let url = request.url;
    for (const [wrong, right] of CampaignApiRouteInterceptor.REPLACEMENTS) {
      if (url.includes(wrong)) {
        url = url.split(wrong).join(right);
      }
    }
    if (url !== request.url) {
      request = request.clone({ url });
    }
    return next.handle(request);
  }
}
