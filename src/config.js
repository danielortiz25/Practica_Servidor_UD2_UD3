// CONFIG.JS — Carga y validación de la configuración (apartado 7)
// Si algún valor es incorrecto, el servidor no arranca.

import 'dotenv/config'; // carga el .env en process.env

const ENTORNOS_VALIDOS = ['development', 'production', 'test'];

function cargarConfig(env) {
  const errores = []; // se acumulan todos los errores

  // --- NODE_ENV ---
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!ENTORNOS_VALIDOS.includes(nodeEnv)) {
    errores.push(`NODE_ENV debe ser uno de: ${ENTORNOS_VALIDOS.join(', ')}`);
  }

  // --- PORT --- (viene como texto, se convierte a número)
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errores.push('PORT debe ser un número entero entre 1 y 65535');
  }

  // --- SESSION_SECRET ---
  let sessionSecret = env.SESSION_SECRET;
  // Solo en pruebas (Vitest, sin .env) se usa un secreto fijo
  if (!sessionSecret && nodeEnv === 'test') {
    sessionSecret = 'secreto-de-pruebas-que-no-se-usa-en-produccion';
  }
  if (!sessionSecret || sessionSecret.length < 32) {
    errores.push('SESSION_SECRET es obligatorio y debe tener al menos 32 caracteres');
  }

  // --- Si hay errores, no arranca (sin mostrar el secreto) ---
  if (errores.length > 0) {
    throw new Error('Configuración no válida:\n- ' + errores.join('\n- '));
  }

  // --- Configuración final (congelada, no se puede modificar) ---
  return Object.freeze({
    port,
    nodeEnv,
    sessionSecret,
    esProduccion: nodeEnv === 'production' // para cookie secure
  });
}

export const config = cargarConfig(process.env);