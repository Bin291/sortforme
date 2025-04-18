// import { Component, Inject } from '@angular/core';
// import {
//   MatDialogRef,
//   MAT_DIALOG_DATA,
//   MatDialogTitle,
//   MatDialogContent,
//   MatDialogActions
// } from '@angular/material/dialog';
// import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
// import {FormsModule} from '@angular/forms';
// import {MatButton} from '@angular/material/button';
// import {NgIf} from '@angular/common';
//
// @Component({
//   selector: 'app-random-dialog',
//   templateUrl: 'random-dialog.component.html',
//   imports: [
//     MatDialogTitle,
//     MatDialogContent,
//     MatFormField,
//     MatLabel,
//     MatDialogActions,
//     FormsModule,
//     MatButton,
//     MatInput,
//     NgIf,
//
//
//   ],
//   styleUrls: ['./random-dialog.component.scss'] // nếu bạn muốn thêm style riêng
// })
// export class RandomDialogComponent {
//   elementCount = 10;
//
//   constructor(
//     public dialogRef: MatDialogRef<RandomDialogComponent>,
//     @Inject(MAT_DIALOG_DATA) public data: any
//   ) {}
//
//   onConfirm() {
//     this.dialogRef.close(this.elementCount);
//   }
//
//   onCancel() {
//     this.dialogRef.close();
//   }
// }
//




import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatHint, MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-random-dialog',
  template: `
    <h2 mat-dialog-title>Random Array</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill">
        <input matInput type="number" [(ngModel)]="elementCount"/>
        <mat-hint *ngIf="elementCount > 27" style="color: red;">Quantity must be ≤ 27</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button [disabled]="elementCount > 27 || elementCount < 1" (click)="onConfirm()">Confirm</button>
    </mat-dialog-actions>
  `,
  imports: [
    MatDialogActions,
    MatHint,
    MatFormField,
    MatDialogContent,
    MatHint,
    FormsModule,
    MatFormField,
    MatDialogTitle,
    MatFormField,
    MatButton,
    MatInput,
    NgIf
  ]
})
export class RandomDialogComponent {
  elementCount = 10;

  constructor(
    public dialogRef: MatDialogRef<RandomDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onConfirm() {
    this.dialogRef.close(this.elementCount);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
