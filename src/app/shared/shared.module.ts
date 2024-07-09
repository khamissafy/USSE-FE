import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InjectionToken, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SettingComponent } from './components/side-bar/components/setting/setting.component';

import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import {MatStepperModule} from '@angular/material/stepper';

import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';

import { ToasterServices } from './components/us-toaster/us-toaster.component';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input-gg';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { InputComponent } from './components/text-input/text-input.component';
import { TooltipModule } from './components/tooltip/tooltip.module';
import { RadioButtonModule } from './components/radio-button/radio-button.module';
import { CheckboxModule } from './components/checkbox/checkbox.module';
import { TagModule } from './components/tag/tag.module';
import { SelectModule } from './components/select/select.module';
import { DeleteModalComponent } from './components/delete-modal/delete-modal.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { NbTimepickerModule, NbDatepickerModule, NbToggleModule } from '@nebular/theme';

import { ToLocalTimePipe } from './pipes/toLocalTime.pipe';
import { SideBarComponent } from './components/side-bar/component/side-bar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorInterceptorService } from '../interceptors/error-interceptor.service';
import { ClickOutsideDirective } from './directives/clickOutside.directive';
import { ConfirmLogOutComponent } from './components/side-bar/components/confirmLogOut/confirmLogOut.component';
export const TRANSLATE_SERVICE = new InjectionToken<TranslateService>('TRANSLATE_SERVICE');
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { TranslationService } from './services/translation.service';
import { TypePipe } from '../pages/messages/type.pipe';
import { HintMessageComponent } from './components/hint-message/hint-message.component';
import { UsButtonDirective } from '../directives/us-button.directive';
import { UsButtonComponent } from './components/us-button/us-button.component';
import { NavActionsComponent } from './components/nav-actions/nav-actions.component';
import { ErrorTranslatePipe } from './pipes/errorTranslate.pipe';
import { HideOptionsComponent } from './components/hideOptions/hideOptions.component';
import { TextMaskingPipe } from './pipes/textMasking.pipe';

// import { SearchCountryField, TooltipLabel, CountryISO } from 'ngx-intl-tel-input';

@NgModule({
  imports: [
    PickerModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatSortModule,
    MatStepperModule,
    FormsModule,
    NgxIntlTelInputModule,
    MatProgressSpinnerModule,
    TagModule,
    CheckboxModule,
    RadioButtonModule,
    TooltipModule,
    SelectModule,
    MatExpansionModule,
    NbTimepickerModule,
    NbDatepickerModule,
    TranslateModule,
  ],
  declarations: [
    SideBarComponent,
    SettingComponent ,
    FooterComponent,
    ToLocalTimePipe,
    HeaderComponent,
    InputComponent,
    ToasterServices,
    DeleteModalComponent,
    ClickOutsideDirective,
    ConfirmLogOutComponent,
    TypePipe,
    HintMessageComponent,
    UsButtonComponent,
    UsButtonDirective,
    NavActionsComponent,
    ErrorTranslatePipe,
    HideOptionsComponent,
    TextMaskingPipe

  ],
  exports:[
    SideBarComponent,
    FooterComponent,
    HeaderComponent,
    ToLocalTimePipe,
    InputComponent,
    SelectModule,
    ToasterServices,
    MatTabsModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatStepperModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatSortModule,
    MatIconModule,
    FormsModule,
    NgxIntlTelInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    CheckboxModule,
    RadioButtonModule,
    TagModule,
    MatExpansionModule,
    TagModule,
    NbTimepickerModule,
    NbDatepickerModule,
    NbToggleModule,
    TranslateModule,
    TypePipe,
    HintMessageComponent,
    UsButtonComponent,
    UsButtonDirective,
    RouterModule,
    NavActionsComponent,
    ClickOutsideDirective,
    TextMaskingPipe

  ],
  
  providers: [
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useFactory: (translationService: TranslationService) => {
        return {
          hasBackdrop: true, // Set other default options if needed
          dir: translationService.getLanguageDirection(), // Dynamic direction based on language
        };
      },
      deps: [TranslationService]
    }
  ],
})
export class SharedModule { }
