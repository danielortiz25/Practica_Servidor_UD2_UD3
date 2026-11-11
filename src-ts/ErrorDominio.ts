// ERROR DE DOMINIO TIPADO (sesión 11)
// El tipo unión limita los códigos que se pueden usar
export type CodigoError = 'NO_ENCONTRADO' | 'NO_DISPONIBLE' | 'PROHIBIDO' | 'NO_CANCELABLE';

export class ErrorDominio extends Error {
  readonly codigo: CodigoError;

  constructor(codigo: CodigoError, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDominio';
    this.codigo = codigo;
  }
}
