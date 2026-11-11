// RUTAS DE RESERVAS (solo usuarios autenticados)
import { Router } from 'express';
import { exigirAutenticacion, comprobarCsrf } from './middleware.js';

export function crearRutasReservas(controlador) {
  const router = Router();
  router.get('/reservas/nueva', exigirAutenticacion, controlador.mostrarFormulario);
  router.post('/reservas', exigirAutenticacion, comprobarCsrf, controlador.crear);
  router.get('/mis-reservas', exigirAutenticacion, controlador.misReservas);
  router.post('/reservas/:id/cancelar', exigirAutenticacion, comprobarCsrf, controlador.cancelar);
  return router;
}
