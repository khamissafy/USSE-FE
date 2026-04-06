import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { PermissionsService } from './permissions.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private permissionService: PermissionsService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    const routeName = route.data['name'];

    if (routeName === 'verification') {
      if (this.authService.getFromValue()) {
        return true;
      }
      this.authService.clearUserInfo();
      return this.router.createUrlTree(['/login']);
    }

    if (routeName === 'change-Passward') {
      if (this.authService.getAccessToReset()) {
        return true;
      }
      this.authService.clearUserInfo();
      return this.router.createUrlTree(['/login']);
    }

    if (routeName === 'login') {
      if (this.authService.checkExistenceAndValidation()) {
        return this.router.createUrlTree(['/devices']);
      }
      this.authService.setRedirectURL(state.url.slice(state.url.lastIndexOf('/')));
      return true;
    }

    if (!this.authService.checkExistenceAndValidation()) {
      this.authService.clearUserInfo();
      return this.router.createUrlTree(['/login']);
    }

    try {
      await this.authService.loadUserInfo();
    } catch {
      this.authService.setRedirectURL(state.url.slice(state.url.lastIndexOf('/')));
      return true;
    }

    if (!this.authService.isLoggedIn()) {
      this.authService.clearUserInfo();
      return this.router.createUrlTree(['/login']);
    }

    const customerId = this.authService.getUserInfo()?.customerId;
    const email = this.authService.getUserInfo()?.email;
    let allowed = true;

    if (customerId && customerId !== '') {
      this.authService.setUserDataObservable(this.permissionService.getUserByEmail(email));
      allowed = await this.authService.hasPermission(routeName);
    }

    if (allowed) {
      this.authService.setRedirectURL(state.url.slice(state.url.lastIndexOf('/')));
      return true;
    }

    this.authService.setRedirectURL(state.url.slice(state.url.lastIndexOf('/')));
    return this.router.createUrlTree(['/messages']);
  }
}
