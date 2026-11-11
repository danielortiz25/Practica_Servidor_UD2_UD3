// RUTAS DE AUTENTICACIÓN
import { Router } from 'express';
import { exigirAutenticacion, comprobarCsrf, limitarLogin } from './middleware.js';

export function crearRutasAuth(controlador) {
  const router = Router();
  router.get('/registro', controlador.mostrarRegistro);
  router.post('/registro', controlador.registrar);
  router.get('/login', controlador.mostrarLogin);
  router.post('/login', limitarLogin, controlador.login);
  router.post('/logout', comprobarCsrf, controlador.logout);
  router.get('/perfil', exigirAutenticacion, controlador.perfil);
  return router;
}
