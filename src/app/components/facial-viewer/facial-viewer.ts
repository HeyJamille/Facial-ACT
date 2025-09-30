// facial-viewer.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-facial-viewer',
  template: './facil-viewer.html',
  imports: [CommonModule],
})
export class FacialViewer {
  imageBase64: string | null = null;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.imageBase64 = nav?.extras?.state?.['imageBase64'] || null;
  }
}
