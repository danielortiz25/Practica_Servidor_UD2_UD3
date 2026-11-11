// RUTAS DE ADMINISTRACIÓN — todas exigen el rol admin
import { Router } from 'express';
import { exigirRol, comprobarCsrf } from './middleware.js';

export function crearRutasAdmin(controlador) {
  const router = Router();
  router.get('/admin/equipos', exigirRol('admin'), controlador.equipos);
  router.post('/admin/equipos', exigirRol('admin'), comprobarCsrf, controlador.crearEquipo);
  router.post('/admin/equipos/:id/estado', exigirRol('admin'), comprobarCsrf, controlador.cambiarEstado);
  router.get('/admin/reservas', exigirRol('admin'), controlador.reservas);
  router.post('/admin/reservas/:id/cancelar', exigirRol('admin'), comprobarCsrf, controlador.cancelarReserva);
  return router;
}
