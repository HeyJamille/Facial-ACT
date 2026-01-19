export interface Person {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexo: string;
  email: string;
  senha?: string;
  celular: string;
  documento: string;
  tipo: string;
  nomePai: string;
  nomeMae: string;
  cep: string;
  complemento: string;
  logradouro: string;
  bairro: string;
  numero: string;
  cidade: string;
  estado: string;
  dataValidacaoFacial: string;
  entidadeID: string;
  dataCriacao: Date;
  facial: string;
  perfilAcesso: string;
  edit: string;
  delet: string;
  arquivoFacial: string;
  dataEnvioFacial: string;
  arquivoCarteirinha: string;
  dataEnvioCarteirinha: string;
  validadeCarteirinha: Date;
  carteirinhaAprovada: boolean;
  motivoRejeicaoCarteirinha: string;
  motivoRejeicaoDocumento: string;
  motivoRejeicaoFacial: string;
  aprovadorCarteirinhaId: string;
  dataAprovacaoCarteirinha: Date;
  facialAprovada: boolean | null;
  aprovadorDocumentoId: string;
  arquivoDocumento: string;
  dataEnvioDocumento: string;
  statusValidacao?: 'Aprovar' | 'Reprovar' | 'Pendente';
  facialIntegrada: string;
  integracaoOcorrencia: string;
  exportado: string;
  statusDocs: string;

  iconFacial: string;
  iconDocumento: string;
  iconCarteirinha: string;

  statusFacial: string;
  statusDocumento: string;
  statusCarteirinha: string;

  arquivoDocumentoOriginal: string;
  UsuarioID: string;
}
