import { Component, EventEmitter, Output, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss']
})
export class ErrorDialogComponent {
  @Output("reloadFunc") reloadFunc: EventEmitter<any> = new EventEmitter();

  public errormessage: String

  constructor (@Inject(MAT_DIALOG_DATA) public data: any) {
    this.errormessage = data.error.message
    console.log(this.errormessage)
  }

  reload() {
    this.data.reload()
  }
}
