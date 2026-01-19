// safe-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl', // Este é o nome que você usa no HTML: | safeUrl
  standalone: true  // Se estiver usando Angular 14+ recomendo deixar como standalone
})
export class SafeUrlPipe implements PipeTransform { // Verifique este nome
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}