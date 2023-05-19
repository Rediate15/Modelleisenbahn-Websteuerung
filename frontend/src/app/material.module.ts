import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import {MatTabsModule } from '@angular/material/tabs';
import {MatSliderModule} from '@angular/material/slider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

@NgModule({
  exports: [
    MatToolbarModule,
    MatIconModule,
    MatTabsModule,
    MatSliderModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatSlideToggleModule,
  ]
})

export class MaterialModule {}