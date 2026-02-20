const video = document.getElementById('video');
let stream = null;

window.addEventListener('message', (e) => {
  if (e.data === 'abrir') {
    startCapture();
  }
});

// Chame as funções ao carregar a página
window.onload = () => {
  aplicarTemaPorLocalizacao();
  startCapture(); // <--- Adicione esta linha aqui
};

function fecharModal() {
  stopCamera();
  if (window.parent.document.getElementById('containerIframe')) {
    window.parent.document.getElementById('containerIframe').style.display = 'none';
  }
}

async function startCapture() {
  document.getElementById('step-camera').style.display = 'flex';
  document.getElementById('step-preview').style.display = 'none';
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    video.srcObject = stream;
  } catch (err) {
    alert('Câmera indisponível.');
    fecharModal();
  }
}

function captureImage() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  document.getElementById('photo-preview').src = canvas.toDataURL('image/jpeg');
  stopCamera();
  document.getElementById('step-camera').style.display = 'none';
  document.getElementById('step-preview').style.display = 'flex';
}

function repeatCapture() {
  startCapture();
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function sendImage() {
  // 1. Pega o ID da URL do Pai
  //const fullPath = window.parent.location.pathname;
  //const segments = fullPath.split('/').filter(Boolean);
  // const userId = segments[segments.length - 2];
  //console.log('userId', userId);
  // 2. Busca o token nos cookies (ajuste 'nome_do_seu_cookie' para o nome real, ex: 'token' ou 'auth_token')
  //const token = getCookie('token');

  // Se a URL for meusite.com.br/123
  const segments = window.parent.location.pathname.split('/').filter(Boolean);
  console.log('segments', segments);

  let userId = null;

  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];

    // Regra: Se o último item for um UUID (contém hífen) ou for um número longo, é o ID.
    // Caso contrário, pegamos o segundo item (índice 1).
    const isIdFormat = lastSegment.includes('-') || !isNaN(lastSegment);

    if (isIdFormat) {
      console.log('CASO 1');
      userId = lastSegment;
    } else {
      console.log('CASO 2');
      // Se o último não parece um ID, pega o segundo item (índice 1)
      // Usamos o operador ?? para garantir que não pegue algo vazio se não houver segundo item
      userId = segments[2] || segments[1];
    }
  }

  console.log('ID Identificado:', userId);

  const btnSend = document.getElementById('btn-send');
  const btnRepeat = document.querySelector('.btn-yellow');
  const statusCont = document.getElementById('status-container');

  btnSend.innerText = 'Enviando...';
  btnSend.disabled = true;

  try {
    // 3. Preparação do arquivo
    const imageBase64 = document.getElementById('photo-preview').src;
    const res = await fetch(imageBase64);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('file', blob, 'facial.jpg');

    // 4. Envio com Token nos Headers
    const response = await fetch(
      `https://apifacial.achetickets.com.br/api/Facial/Externo/${userId}`,
      {
        method: 'POST',
        body: formData,
      },
    );
    console.log('resppnse', response);

    if (response.ok) {
      //console.log('Captura facial enviada com sucesso!');
      document.getElementById('status-container').style.display = 'flex';
      btnSend.style.display = 'none';
      if (btnRepeat) btnRepeat.style.display = 'none';
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
      alert(`Erro ao enviar: ${errorText}`);
    }
  } catch (err) {
    //console.error('Erro na requisição:', err);
    alert('Erro de conexão.');
  } finally {
    btnSend.disabled = false;
    btnSend.innerText = 'Enviar';
  }
}

function aplicarTemaPorLocalizacao() {
  const url = window.parent.location.href.toLowerCase();
  let href = '';

  if (url.includes('fortaleza')) {
    href = 'tema-fortaleza.css';
  } else if (url.includes('ceara')) {
    href = 'tema-ceara.css';
  }
  // Se não encontrar nenhuma das palavras acima, carrega o padrão
  else {
    href = 'script-facial.css';
  }

  // Cria o elemento uma única vez com o arquivo definido acima
  if (href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    console.log('link.href aplicado:', link.href);
    document.head.appendChild(link);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}
