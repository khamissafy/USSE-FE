import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchPipe } from './search.pipe';
import { FormsModule } from '@angular/forms';
import { TagModule } from '../tag/tag.module';
import { CheckboxModule } from '../checkbox/checkbox.module';
import { RadioButtonModule } from '../radio-button/radio-button.module';
import { SelectComponent } from './component/select.component';
import { DynamicRendererComponent } from './component/dynamic-renderer/dynamic-renderer.component';
import { TooltipModule } from '../tooltip/tooltip.module';
import { DeviceType } from '../../pipes/deviceType.pipe';

@NgModule({
  declarations: [SelectComponent, SearchPipe, DynamicRendererComponent,DeviceType],
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    CheckboxModule,
    RadioButtonModule,
    TooltipModule,
  ],
  exports: [SelectComponent, SearchPipe,DeviceType],
})
export class SelectModule {}
