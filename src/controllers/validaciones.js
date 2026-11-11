// VALIDACIÓN Y CONVERSIÓN DE DATOS RECIBIDOS (sesiones 6, 9 y 10)
// Se copian solo los campos esperados, nunca req.body completo.
import { ErrorDominio } from '../services/errores.js';

// Convierte un texto en entero positivo o lanza DATOS_INVALIDOS (→ 400)
export function enteroPositivo(valor, nombre) {
  if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) {
    throw new ErrorDominio('DATOS_INVALIDOS',
      `El campo ${nombre} debe ser un entero positivo.`);
  }
  return Number(valor);
}

export function normalizarRegistro(body = {}) {
  return {
    nombre: String(body.nombre ?? '').trim(),
    email: String(body.email ?? '').trim().toLowerCase(),
    password: String(body.password ?? '')
  };
}

export function validarRegistro(valores) {
  const errores = {};
  if (valores.nombre.length < 2 || valores.nombre.length > 60) {
    errores.nombre = 'El nombre debe tener entre 2 y 60 caracteres.';
  }
  if (!valores.email.includes('@') || valores.email.length > 254) {
    errores.email = 'Introduce un correo válido.';
  }
  if (valores.password.length < 8 || valores.password.length > 72) {
    errores.password = 'La contraseña debe tener entre 8 y 72 caracteres.';
  }
  return errores;
}

export function normalizarLogin(body = {}) {
  return {
    email: String(body.email ?? '').trim().toLowerCase(),
    password: String(body.password ?? '')
  };
}

export function normalizarEquipo(body = {}) {
  return {
    codigo: String(body.codigo ?? '').trim().toUpperCase(),
    nombre: String(body.nombre ?? '').trim(),
    tipo: String(body.tipo ?? '')
  };
}

export function validarEquipo(valores) {
  const errores = {};
  if (valores.codigo.length < 3 || valores.codigo.length > 20) {
    errores.codigo = 'El código debe tener entre 3 y 20 caracteres.';
  }
  if (valores.nombre.length < 2 || valores.nombre.length > 80) {
    errores.nombre = 'El nombre debe tener entre 2 y 80 caracteres.';
  }
  if (valores.tipo !== 'portatil' && valores.tipo !== 'sobremesa') {
    errores.tipo = 'El tipo debe ser portátil o sobremesa.';
  }
  return errores;
}
