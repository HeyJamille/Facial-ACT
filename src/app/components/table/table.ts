// Bibliotecas
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  Input,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

// Models
import { Person } from '../../models/person.model';
import { ModalFacial } from '../modal-facial/modal-facial';

// Services
import { ApiService } from '../../services/api-service/api-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { UtilsService } from '../../utils/utils-service';
import { ModalDocument } from '../modal-document/modal-document';
import { catchError, concat, forkJoin, from, of } from 'rxjs';
import { ModalAllDocument } from '../modal-all-document/modal-all-document';
import { ModalCard } from '../modal-card/modal-card';

export interface AuthField {
  name: keyof Person;
  label: string;
}

export interface Table {
  id: number;
  name: string;
  showFacialModal?: boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalFacial, ModalDocument, ModalAllDocument, ModalCard],
  templateUrl: './table.html',
})
export class Table {
  @Input() data: Person[] = [];
  @Input() fields: AuthField[] = [];
  @Input() actions: string[] = [];
  @Input() actionType: 'icons' | 'select' | 'check' = 'icons';

  @Output() actionEvent = new EventEmitter<{ action: string; id: string }>();
  @Output() editPerson = new EventEmitter<string>();
  @Output() deletePerson = new EventEmitter<string>();

  currentPersonName: string = '';
  showFacial = false;
  currentFacialId: string | null = null;
  facialData: { [key: string]: string } = {};

  arquivoUrlFrente: string = '';
  arquivoUrlVerso: string = '';

  currentDocumentId?: string;
  documentData: Record<string, string> = {};

  currentCardId?: string;
  cardData: Record<string, string> = {};

  showDocument = false;
  showCard = false;

  selectedAction: { [key: string]: string } = {};
  arquivoUrl: string | null = null;
  isPdf: boolean = false;
  selectPerson: Person | null = null;

  showModalAllDocument = false;
  arquivosTodos = {
    facial: '',
    isDocumentoPdf: false,
    isCarteirinhaPdf: false,
    // Adicione estas 4 propriedades aqui:
    urlDocFrente: '',
    urlDocVerso: '',
    urlCardFrente: '',
    urlCardVerso: '',
  };

  // URLs específicas para o "Visualizar Tudo"
  urlDocFrente: string = '';
  urlDocVerso: string = '';
  urlCardFrente: string = '';
  urlCardVerso: string = '';

  resultados: any[] = [];
  pollingInterval: any;

  constructor(
    private api: ApiService,
    private router: Router,
    private toastr: ToastrService,
    private auth: AuthService,
    public utils: UtilsService,
    private cdr: ChangeDetectorRef, // Adicione o ChangeDetectorRef
  ) {}

  ngOnChanges() {
    if (this.data?.length) {
      this.verificarDocumentos();

      this.data.forEach((person) => {
        if (!this.selectedAction[person.id]) {
          this.selectedAction[person.id] = '';
        }
      });
    }
  }

  async onActionChange(event: Event, person: Person) {
    const value = (event.target as HTMLSelectElement).value;
    const token = this.auth.getToken();

    if (value === 'visualizar-facial') {
      try {
        this.selectPerson = person;
        //const token = this.auth.getToken();

        if (!token) {
          this.toastr.error('Usuário não autenticado', 'Erro');
          return;
        }

        const data = await this.api.fetchFacialBase64(person.id, token);

        if (!data?.base64) {
          this.toastr.error('Nenhuma imagem encontrada', 'Erro');
          return;
        }

        // REMOVE QUALQUER CAPTURA FACIAL ANTERIOR
        Object.keys(localStorage)
          .filter((key) => key.startsWith('facial_'))
          .forEach((key) => localStorage.removeItem(key));

        // SALVA SOMENTE A ATUAL
        localStorage.setItem(`facial_${person.id}`, data.base64);

        this.facialData[person.id] = data.base64;
        this.openFacialModal(person.id, person.nomeCompleto);
      } catch (err: any) {
        //console.log('err', err.status);
        if (err.status === 401) {
          this.toastr.warning(
            'Sua sessão expirou. Por favor, faça login novamente.',
            'Sessão Expirada',
          );
        } else {
          console.error('Erro ao carregar a captura facial', err);
          this.toastr.error('Erro ao carregar a captura facial', 'Erro');
        }
      }
    }

    if (value === 'visualizar-documento') {
      //const token = this.auth.getToken();
      this.selectPerson = person;

      if (!token) {
        this.toastr.error('Usuário não autenticado', 'Erro');
        return;
      }

      const tipoArquivo = 'documento';

      // Limpamos URLs antigas antes de começar
      if (this.arquivoUrlFrente) URL.revokeObjectURL(this.arquivoUrlFrente);
      if (this.arquivoUrlVerso) URL.revokeObjectURL(this.arquivoUrlVerso);
      this.arquivoUrlFrente = '';
      this.arquivoUrlVerso = '';

      const downloadFrente$ = this.api.downloadFile(person.id, token, tipoArquivo, false);
      const downloadVerso$ = this.api.downloadFile(person.id, token, tipoArquivo, true).pipe(
        catchError(() => of(null)), // Se falhar o verso, segue o fluxo com null
      );

      // O concat executa um após o outro
      concat(downloadFrente$, downloadVerso$).subscribe({
        next: (blob) => {
          if (!blob) return;

          // Na primeira emissão (Frente)
          if (!this.arquivoUrlFrente) {
            this.isPdf = blob.type === 'application/pdf';
            this.arquivoUrlFrente = URL.createObjectURL(blob);
            this.arquivoUrl = this.arquivoUrlFrente; // Referência para o iframe de PDF
          }
          // Na segunda emissão (Verso) - Só processa se não for PDF
          else if (!this.isPdf) {
            this.arquivoUrlVerso = URL.createObjectURL(blob);
          }
        },
        error: (err) => {
          if (err.status === 401) {
            this.toastr.warning(
              'Sua sessão expirou. Por favor, faça login novamente.',
              'Sessão Expirada',
            );
          } else {
            console.error(err);
            this.toastr.error('Erro ao carregar os documentos.');
          }
        },
        complete: () => {
          // Quando ambos terminarem (ou o PDF terminar e o verso for ignorado/null)
          if (!this.arquivoUrlFrente) {
            this.toastr.warning('Nenhum documento encontrado.');
            return;
          }
          this.openDocumentModal(person.id);
        },
      });
    }

    if (value === 'visualizar-carteirinha') {
      //const token = this.auth.getToken();
      this.selectPerson = person;

      if (!token) {
        this.toastr.error('Usuário não autenticado', 'Erro');
        return;
      }

      const tipoArquivo = 'carteirinha';

      // Limpeza inicial
      if (this.arquivoUrlFrente) URL.revokeObjectURL(this.arquivoUrlFrente);
      if (this.arquivoUrlVerso) URL.revokeObjectURL(this.arquivoUrlVerso);
      this.arquivoUrlFrente = '';
      this.arquivoUrlVerso = '';

      // 1. Primeiro baixamos a FRENTE
      this.api.downloadFile(person.id, token, tipoArquivo, false).subscribe({
        next: (blobFrente) => {
          if (!blobFrente || blobFrente.size === 0) {
            this.toastr.warning('Nenhuma carteirinha encontrada.');
            return;
          }

          this.isPdf = blobFrente.type === 'application/pdf';
          this.arquivoUrlFrente = URL.createObjectURL(blobFrente);
          this.arquivoUrl = this.arquivoUrlFrente;

          // 2. CONDIÇÃO: Se for PDF, abre o modal e PARA aqui.
          if (this.isPdf) {
            this.openCardModal(person.id);
          }
          // 3. Se NÃO for PDF, busca o verso.
          else {
            this.api
              .downloadFile(person.id, token, tipoArquivo, true)
              .pipe(catchError(() => of(null)))
              .subscribe({
                next: (blobVerso) => {
                  if (blobVerso && blobVerso.size > 0) {
                    this.arquivoUrlVerso = URL.createObjectURL(blobVerso);
                  }
                  this.openCardModal(person.id);
                },
                error: () => this.openCardModal(person.id), // Abre mesmo se o verso falhar
              });
          }
        },
        error: (err) => {
          if (err.status === 401) {
            this.toastr.warning(
              'Sua sessão expirou. Por favor, faça login novamente.',
              'Sessão Expirada',
            );
          } else {
            if (err.status === 401) {
              this.toastr.warning(
                'Sua sessão expirou. Por favor, faça login novamente.',
                'Sessão Expirada',
              );
            } else {
              console.error(err);
              this.toastr.error('Erro ao carregar a frente da carteirinha.');
            }
          }
        },
      });
    }

    if (value === 'visualizar-tudo') {
      this.selectPerson = person;
      const token = this.auth.getToken();

      if (!token) {
        this.toastr.error('Usuário não autenticado');
        return;
      }

      // Reinicia o objeto para não mostrar lixo de chamadas anteriores
      this.arquivosTodos = {
        facial: '',
        isDocumentoPdf: false,
        isCarteirinhaPdf: false,
        urlDocFrente: '',
        urlDocVerso: '',
        urlCardFrente: '',
        urlCardVerso: '',
      };

      const facial$ = from(this.api.fetchFacialBase64(person.id, token)).pipe(
        catchError(() => of(null)),
      );
      const docFrente$ = this.api
        .downloadFile(person.id, token, 'documento', false)
        .pipe(catchError(() => of(null)));
      const docVerso$ = this.api
        .downloadFile(person.id, token, 'documento', true)
        .pipe(catchError(() => of(null)));
      const cardFrente$ = this.api
        .downloadFile(person.id, token, 'carteirinha', false)
        .pipe(catchError(() => of(null)));
      const cardVerso$ = this.api
        .downloadFile(person.id, token, 'carteirinha', true)
        .pipe(catchError(() => of(null)));

      forkJoin({
        facial: facial$,
        docFrente: docFrente$,
        docVerso: docVerso$,
        cardFrente: cardFrente$,
        cardVerso: cardVerso$,
      }).subscribe({
        // ... dentro do next do forkJoin
        next: (res) => {
          // 1. Facial
          this.arquivosTodos.facial = res.facial?.base64 ?? '';

          // 2. Documento Frente
          if (res.docFrente instanceof Blob && res.docFrente.size > 0) {
            console.log('docuemnto fnrete', res.docFrente);
            this.arquivosTodos.isDocumentoPdf = res.docFrente.type === 'application/pdf';
            this.arquivosTodos.urlDocFrente = URL.createObjectURL(res.docFrente);
          }

          // 2.1 Documento Verso (Independente da frente existir ou não)
          if (res.docVerso instanceof Blob && res.docVerso.size > 0) {
            console.log('docuemnto verso', res.docVerso);
            // Só mostramos o verso se não for PDF (PDFs costumam ter tudo em um arquivo só)
            if (!this.arquivosTodos.isDocumentoPdf) {
              this.arquivosTodos.urlDocVerso = URL.createObjectURL(res.docVerso);
            }
          }

          // 3. Carteirinha Frente
          if (res.cardFrente instanceof Blob && res.cardFrente.size > 0) {
            console.log('carteirinha frente', res.cardFrente);

            this.arquivosTodos.isCarteirinhaPdf = res.cardFrente.type === 'application/pdf';
            this.arquivosTodos.urlCardFrente = URL.createObjectURL(res.cardFrente);
          }

          // 3.1 Carteirinha Verso
          if (res.cardVerso instanceof Blob && res.cardVerso.size > 0) {
            console.log('carteirinha verso', res.cardVerso);
            if (!this.arquivosTodos.isCarteirinhaPdf) {
              this.arquivosTodos.urlCardVerso = URL.createObjectURL(res.cardVerso);
            }
          }

          this.showModalAllDocument = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toastr.error('Erro ao buscar pacote de documentos');
          console.error(err);
        },
      });
    } // Chave de fechamento do if (value === 'visualizar-tudo') corrigida
  }

  onAction(action: string, id: string) {
    this.actionEvent.emit({ action, id });
  }

  onEdit(id: string) {
    this.editPerson.emit(id);
  }

  onDelete(id: string) {
    this.deletePerson.emit(id);
  }

  openFacialModal(personId: string, personName: string) {
    this.currentFacialId = personId;
    this.currentPersonName = personName;
    this.showFacial = true;
  }

  openDocumentModal(personId: string) {
    this.currentDocumentId = personId;
    this.showDocument = true;
  }

  openCardModal(personId: string) {
    this.currentCardId = personId;
    this.showCard = true;
  }

  verificarDocumentos() {
    this.data.forEach((person) => {
      this.api.getApproveByCPF(person).subscribe({
        next: (response) => {
          //console.log('response', response);
          // Atualizamos a referência da pessoa diretamente no array 'data'
          // Certifique-se de que os nomes dos campos (facial, arquivoDocumento, etc)
          // coincidem com o que a sua API retorna.

          person.iconFacial = response.iconFacial;
          person.iconDocumento = response.iconDocumento;
          person.iconCarteirinha = response.iconCarteirinha;

          person.statusFacial = response.statusFacial; // Esperado 'S' ou 'N' conforme seu HTML
          person.statusDocumento = response.statusDocumento; // Ajuste conforme o retorno da API
          person.statusCarteirinha = response.statusCarteirinha; // Esperado boolean

          //console.log(`Dados atualizados para ${person.nomeCompleto}:`, response);
        },
        error: (err) => {
          console.error('Erro ao consultar pessoa');
        },
      });
    });
  }

  // Método para fechar qualquer modal e resetar o select da pessoa
  fecharModais() {
    if (this.selectPerson) {
      // Primeiro limpamos o visual do select
      this.selectedAction[this.selectPerson.id] = '';
    }

    // Depois fechamos as flags de controle
    this.showFacial = false;
    this.showDocument = false;
    this.showCard = false;
    this.showModalAllDocument = false;

    // Por último limpamos a referência da pessoa
    this.selectPerson = null;

    // Força o Angular a atualizar a tela
    this.cdr.detectChanges();
  }
}
