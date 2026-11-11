// MIDDLEWARE — Funciones que se ejecutan antes o después de las rutas
// (sesiones 8, 9 y 10)
import crypto from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { ErrorDominio } from '../services/errores.js';

// ---------- USUARIO ACTUAL ----------
// A partir de req.session.usuarioId busca el usuario en el servidor.
// El rol nunca se lee de una cookie del cliente.
export function crearCargarUsuarioActual(servicioUsuarios) {
  return async function cargarUsuarioActual(req, res, next) {
    const usuarioId = req.session.usuarioId;
    res.locals.usuarioActual = usuarioId
      ? await servicioUsuarios.buscarPorId(usuarioId)
      : null;
    return next();
  };
}

// ---------- AUTENTICACIÓN ----------
// Visitante anónimo → 303 al formulario de login
export function exigirAutenticacion(req, res, next) {
  if (!res.locals.usuarioActual) {
    return res.redirect(303, '/login');
  }
  return next();
}

// ---------- AUTORIZACIÓN POR ROL ----------
// Anónimo → 303 al login. Usuario sin el rol → 403.
export function exigirRol(...rolesPermitidos) {
  return (req, res, next) => {
    const usuario = res.locals.usuarioActual;
    if (!usuario) {
      return res.redirect(303, '/login');
    }
    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).render('error', {
        titulo: 'Acceso denegado',
        mensaje: 'No tienes permiso para acceder.'
      });
    }
    return next();
  };
}

// ---------- CSRF ----------
// Crea un token por sesión y lo deja en res.locals para los formularios
export function prepararCsrf(req, res, next) {
  req.session.csrfToken ??= crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  return next();
}

// Comprueba el campo oculto _csrf en los POST que modifican datos
export function comprobarCsrf(req, res, next) {
  const esperado = String(req.session.csrfToken ?? '');
  const recibido = String(req.body?._csrf ?? '');
  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);

  if (a.length === 0 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).render('error', {
      titulo: 'Petición no permitida',
      mensaje: 'Petición no permitida.'
    });
  }
  return next();
}

// ---------- LÍMITE DE INTENTOS DE LOGIN ----------
export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,                // 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos. Prueba más tarde.'
});

// ---------- MENSAJE DE CONFIRMACIÓN (FLASH) ----------
// Pasa el aviso guardado en la sesión a la vista y lo borra (un solo uso)
export function mostrarAviso(req, res, next) {
  res.locals.aviso = req.session.aviso ?? null;
  delete req.session.aviso;
  return next();
}

// ---------- ERRORES ----------
// Ruta que no existe → 404
export function noEncontrado(req, res) {
  return res.status(404).render('error', {
    titulo: 'No encontrado',
    mensaje: 'Página no encontrada.'
  });
}

// Código HTTP de cada error de dominio
const estados = {
  DATOS_INVALIDOS: 400,
  PROHIBIDO: 403,
  NO_ENCONTRADO: 404,
  NO_DISPONIBLE: 409,
  NO_CANCELABLE: 409,
  DUPLICADO: 409
};

// Tratamiento centralizado de errores (4 parámetros).
// El usuario nunca ve trazas, secretos ni detalles internos.
export function tratarError(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ErrorDominio && estados[err.codigo]) {
    return res.status(estados[err.codigo]).render('error', {
      titulo: 'Error',
      mensaje: err.message
    });
  }

  console.error('Fallo interno al procesar una petición');
  return res.status(500).render('error', {
    titulo: 'Error',
    mensaje: 'No se ha podido completar la operación.'
  });
}

export { estados };
