import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '../ui/button/button';

@Component({
  selector: 'app-recover-pwd',
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './recover-pwd.html',
})
export class RecoverPwd {
  @Input() showModal = false;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit(); // send father event
  }
}
