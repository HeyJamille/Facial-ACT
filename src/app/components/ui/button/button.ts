import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.html',
  standalone: true,
})
export class Button {
  @Input() buttonText: string = 'Botão';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() className: string = '';
}
