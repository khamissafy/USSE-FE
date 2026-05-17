import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { PlansRoutingModule } from './plans-routing.module';
import { PlansComponent } from './plans.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    PlansRoutingModule,
  ],
  declarations: [PlansComponent],
})
export class PlansModule {}
