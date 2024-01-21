import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { SharedModule } from '../../../shared/shared.module';
import { LocationDetailsComponent } from './location-details.component';

@NgModule({
  declarations: [LocationDetailsComponent],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxChartsModule,
    BrowserAnimationsModule,
  ],
  providers: [],
})
export class LocationDetailsModule {}
