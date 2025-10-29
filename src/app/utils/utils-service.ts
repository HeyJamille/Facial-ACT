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

  // Validador de CPF
  validaCPF(cpf: string): boolean {
    let Soma = 0;
    let Resto;

    const strCPF = String(cpf).replace(/[^\d]/g, '');

    if (strCPF.length !== 11) return false;

    if (
      [
        '00000000000',
        '11111111111',
        '22222222222',
        '33333333333',
        '44444444444',
        '55555555555',
        '66666666666',
        '77777777777',
        '88888888888',
        '99999999999',
      ].includes(strCPF)
    )
      return false;

    for (let i = 1; i <= 9; i++) Soma += parseInt(strCPF.substring(i - 1, i)) * (11 - i);

    Resto = (Soma * 10) % 11;

    if (Resto === 10 || Resto === 11) Resto = 0;
    if (Resto !== parseInt(strCPF.substring(9, 10))) return false;

    Soma = 0;
    for (let i = 1; i <= 10; i++) Soma += parseInt(strCPF.substring(i - 1, i)) * (12 - i);

    Resto = (Soma * 10) % 11;

    if (Resto === 10 || Resto === 11) Resto = 0;
    if (Resto !== parseInt(strCPF.substring(10, 11))) return false;

    return true;
  }
}
