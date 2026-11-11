// ERROR DE DOMINIO — Situaciones previstas del negocio (sesión 10)
// Códigos usados: DATOS_INVALIDOS, PROHIBIDO, NO_ENCONTRADO,
// NO_DISPONIBLE, NO_CANCELABLE y DUPLICADO.
// El servicio no sabe de códigos HTTP: los traduce tratarError.
export class ErrorDominio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = 'ErrorDominio';
    this.codigo = codigo;
  }
}
