import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { LoginService } from 'src/app/pages/login/login.service';

@Component({
  selector: 'app-confirmLogOut',
  templateUrl: './confirmLogOut.component.html',
  styleUrls: ['./confirmLogOut.component.scss']
})
export class ConfirmLogOutComponent implements OnInit {
  isLoading:boolean;
  constructor(public dialogRef: MatDialogRef<ConfirmLogOutComponent>,
    private router:Router,
    private authService:AuthService,
    private loginService:LoginService) { }

  ngOnInit() {
  }
  submit() {
    this.isLoading = true;
    this.loginService.revokeToken().subscribe({
      complete: () => this.doLogout(),
      error: () => this.doLogout()
    });
  }

  private doLogout(): void {
    this.authService.clearUserInfo();
    this.isLoading = false;
    this.onClose();
    this.router.navigateByUrl('login');
  }

  onClose(): void {
    this.dialogRef.close();
}

}
