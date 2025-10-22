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
  facial: string;
  edit: string;
  delet: string;
  arquivoFacial: string;
  dataEnvioFacial: string;
  statusValidacao?: 'Aprovar' | 'Reprovar' | 'Pendente';
}
