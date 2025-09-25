import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recover-pwd',
  imports: [CommonModule, FormsModule],
  templateUrl: './recover-pwd.html',
})
export class RecoverPwd {
  @Input() showModal = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
