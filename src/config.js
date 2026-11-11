// CONFIG.JS — Configuración validada al arrancar (apartado 7)
// Node carga el .env con: node --env-file=.env src/server.js
// Si algo es incorrecto se lanza un error y el servidor no arranca.

// --- NODE_ENV ---
const entorno = process.env.NODE_ENV ?? 'development';
if (!['development', 'test', 'production'].includes(entorno)) {
  throw new Error('NODE_ENV no válido');
}

// --- PORT --- (llega como texto: se comprueba y se convierte)
const puertoTexto = process.env.PORT ?? '3000';
const puerto = Number(puertoTexto);
if (!/^\d+$/.test(puertoTexto) || puerto < 1 || puerto > 65535) {
  throw new Error('PORT debe estar entre 1 y 65535');
}

// --- SESSION_SECRET ---
// En las pruebas (Vitest) no se carga el .env: se usa un secreto fijo de prueba
let secreto = process.env.SESSION_SECRET;
if (!secreto && entorno === 'test') {
  secreto = 'secreto-solo-para-las-pruebas-automaticas';
}
if (!secreto || secreto.length < 32) {
  throw new Error('SESSION_SECRET no está configurado correctamente');
}

// --- Configuración final (congelada, no se puede modificar) ---
export const config = Object.freeze({
  entorno,
  puerto,
  produccion: entorno === 'production',
  sessionSecret: secreto
});
