import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  maskPhone(value: string | number): string {
    if (!value) return '';
    const v = value.toString().replace(/\D/g, ''); // remove tudo que não é número

    if (v.length === 11) {
      const ddd = v.slice(0, 2); // DDD
      const last2 = v.slice(-2); // últimos 2 números
      const stars = '*'.repeat(v.length - 4); // resto mascarado
      return `(${ddd}) ${stars}${last2}`;
    }

    if (v.length === 10) {
      const ddd = v.slice(0, 2);
      const last2 = v.slice(-2);
      const stars = '*'.repeat(v.length - 4);
      return `(${ddd}) ${stars}${last2}`;
    }

    return value.toString();
  }

  // Mask for CPF or passport
  maskId(value: string | null | undefined, fieldName?: string): string {
    if (!value) return '';

    const raw = String(value).replace(/\D/g, ''); // remove tudo que não é número

    // if have 11 number -> cpf
    if (raw.length === 11) {
      const first = raw.slice(0, 3);
      const last = raw.slice(-2);
      return `${first}.***.***-${last}`;
    }

    // passport
    const first = value.slice(0, 2);
    const last = value.slice(-2);
    const stars = '*'.repeat(Math.max(3, value.length - 4));
    return `${first}${stars}${last}`;
  }

  // Mask for email
  maskEmail(email: string | null | undefined): string {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (!domain) return email; // caso email inválido
    if (user.length <= 4) {
      // se o usuário tiver 4 ou menos letras, mostra só as primeiras e últimas
      return `${user[0]}*${user.slice(-1)}@${domain}`;
    }
    const first2 = user.substring(0, 1); // primeira letra
    const last2 = user.slice(-1); // última letra
    const stars = '*'.repeat(user.length - 4);
    return `${first2}${stars}${last2}@${domain}`;
  }
}
