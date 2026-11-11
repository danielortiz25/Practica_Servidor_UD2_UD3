// RUTAS DE EQUIPOS (públicas)
import { Router } from 'express';

export function crearRutasEquipos(controlador) {
  const router = Router();
  router.get('/equipos', controlador.listar);
  router.get('/equipos/:id', controlador.ficha);
  router.post('/preferencias', controlador.guardarPreferencia);
  return router;
}
