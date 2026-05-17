import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { MatDialogModule } from '@angular/material/dialog'
import { SharedModule } from 'src/app/shared/shared.module'
import { EvolutionDeviceListComponent } from './evolution-device-list/evolution-device-list.component'
import { EvolutionDeviceAddComponent } from './evolution-device-add/evolution-device-add.component'
import { EvolutionDeviceDetailComponent } from './evolution-device-detail/evolution-device-detail.component'
import { EvolutionConfirmDialogComponent } from './evolution-confirm-dialog/evolution-confirm-dialog.component'

const routes: Routes = [
  { path: '', component: EvolutionDeviceListComponent },
  { path: 'add', component: EvolutionDeviceAddComponent },
  { path: ':deviceId', component: EvolutionDeviceDetailComponent }
]

@NgModule({
  declarations: [
    EvolutionDeviceListComponent,
    EvolutionDeviceAddComponent,
    EvolutionDeviceDetailComponent,
    EvolutionConfirmDialogComponent
  ],
  imports: [CommonModule, SharedModule, ReactiveFormsModule, RouterModule.forChild(routes), MatDialogModule]
})
export class EvolutionDeviceModule {}
