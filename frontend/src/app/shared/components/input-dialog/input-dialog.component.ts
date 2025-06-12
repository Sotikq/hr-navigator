import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface InputDialogData {
  title: string;
  message: string;
  placeholder?: string;
  required?: boolean;
  inputType?: 'text' | 'url' | 'textarea';
}

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-container">
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      
      <div class="input-container">
        <input 
          *ngIf="data.inputType !== 'textarea'"
          [(ngModel)]="inputValue" 
          [type]="data.inputType || 'text'"
          [placeholder]="data.placeholder || ''"
          class="dialog-input"
          (keyup.enter)="onConfirm()"
          #inputRef>
        
        <textarea 
          *ngIf="data.inputType === 'textarea'"
          [(ngModel)]="inputValue" 
          [placeholder]="data.placeholder || ''"
          class="dialog-textarea"
          rows="3"
          #inputRef></textarea>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-secondary" (click)="onCancel()">Отмена</button>
        <button 
          class="btn btn-primary" 
          (click)="onConfirm()"
          [disabled]="data.required && !inputValue">
          Подтвердить
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
      min-width: 400px;
    }
    
    .dialog-title {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 500;
    }
    
    .dialog-message {
      margin: 0 0 20px 0;
      color: #666;
    }
    
    .input-container {
      margin-bottom: 24px;
    }
    
    .dialog-input, .dialog-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }
    
    .dialog-input:focus, .dialog-textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,.25);
    }
    
    .dialog-textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: #5a6268;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }
  `]
})
export class InputDialogComponent {
  inputValue: string = '';

  constructor(
    public dialogRef: MatDialogRef<InputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.data.required && !this.inputValue) {
      return;
    }
    this.dialogRef.close(this.inputValue);
  }
} 