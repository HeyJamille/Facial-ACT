import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  template: `<div id="n8n-chat-container"></div>`, // Renderizacao do chat
})
export class Chatbot implements OnInit {
  ngOnInit() {
    this.loadChatScript();
  }

  loadChatScript() {
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
    import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat@0/dist/chat.bundle.es.js';

    createChat({
      webhookUrl: 'https://n8n.srv1293639.hstgr.cloud/webhook/995a72a1-3a48-4047-97ae-f8bf2741d472/chat',
      mode: 'bubble',
      showWelcomeScreen: true,
      defaultLanguage: 'pt-BR',
      
      /* Mensagem Inicial */
      initialMessages: [
        'Olá! 👋',
        'Como posso ajudar no seu atendimento hoje?'
      ],

      /* --- Muda titulo e subtitulo --- */
      i18n: {
        'pt-BR': { 
          title: 'Atendimento Online', 
          subtitle: '',
          footer: 'Powered by n8n',
          inputPlaceholder: 'Digite aqui...'
        }
      }
    });
  `;
    document.body.appendChild(script);

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat@0/dist/style.css';
    document.head.appendChild(styleLink);
  }
}
