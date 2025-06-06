import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PaymentService } from '../../../services/payment.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-buy-dialog',
  imports: [
    CommonModule,
    MatDialogModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule
  ],
  templateUrl: './buy-dialog.component.html',
  styleUrl: './buy-dialog.component.scss'
})
export class BuyDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BuyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {
    this.buyForm = this.fb.group({
      phone: ['+7', [
        Validators.required,
        Validators.pattern(/^\+7\d{10}$/),
        Validators.minLength(12),
        Validators.maxLength(12)
      ]]
    });

  }

  buyForm!: FormGroup;

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    if (this.buyForm.valid) {
      console.log(this.data.message, this.buyForm.value.phone);
      this.paymentService.buyCourse(this.data.message, this.buyForm.value.phone).subscribe((response) => {
        console.log(response);
        this.dialogRef.close(true);
      });
    }
  }

  getErrorMessage(): string {
    const control = this.buyForm.get('phone');
    if (control?.hasError('required')) {
      return 'Введите номер телефона';
    }
    if (control?.hasError('pattern')) {
      return 'Неверный формат номера телефона';
    }
    if (control?.hasError('minlength') || control?.hasError('maxlength')) {
      return 'Номер должен содержать 10 цифр после +7';
    }
    return '';
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Если значение пустое или только +7, оставляем как есть
    if (value === '' || value === '+7') {
      this.buyForm.patchValue({ phone: '+7' }, { emitEvent: false });
      return;
    }

    // Удаляем все кроме цифр и +
    value = value.replace(/[^\d+]/g, '');

   

    // Ограничиваем длину
    if (value.length > 12) {
      value = value.slice(0, 12);
    }

    // Обновляем значение в форме
    this.buyForm.patchValue({ phone: value }, { emitEvent: false });
  }
}
