// CONTROLADOR DE EQUIPOS — Catálogo, ficha y cookie de preferencias
import { ErrorDominio } from '../services/errores.js';
import { TIPOS } from '../services/funcionesReservas.js';
import { enteroPositivo } from './validaciones.js';

export function crearControladorEquipos(servicio, produccion) {
  return {
    // GET /equipos?tipo=portatil&operativos=true
    async listar(req, res, next) {
      try {
        // Cookie de preferencias: se usa solo si tiene un valor válido
        const preferido = TIPOS.includes(req.cookies.tipoPreferido)
          ? req.cookies.tipoPreferido
          : '';

        // Si la URL no trae tipo, el filtro inicial es el de la cookie
        let tipo = req.query.tipo;
        if (tipo === undefined) {
          tipo = preferido || 'todos';
        }
        if (tipo !== 'todos' && !TIPOS.includes(tipo)) {
          throw new ErrorDominio('DATOS_INVALIDOS', 'Tipo de equipo no válido.');
        }

        const operativos = req.query.operativos ?? 'false';
        if (operativos !== 'true' && operativos !== 'false') {
          throw new ErrorDominio('DATOS_INVALIDOS', 'El filtro operativos debe ser true o false.');
        }

        const equipos = await servicio.listar(tipo, operativos === 'true');
        return res.render('equipos/lista', {
          titulo: 'Equipos',
          equipos,
          tipo,
          operativos: operativos === 'true',
          preferido
        });
      } catch (err) {
        return next(err);
      }
    },

    // GET /equipos/:id
    async ficha(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'equipo');
        const { equipo, ocupados } = await servicio.ficha(id);
        return res.render('equipos/ficha', { titulo: equipo.nombre, equipo, ocupados });
      } catch (err) {
        return next(err);
      }
    },

    // POST /preferencias — guarda el tipo preferido en una cookie (sesión 7)
    // Es solo una preferencia: nunca se usa para dar permisos.
    guardarPreferencia(req, res) {
      const tipo = String(req.body?.tipo ?? '');

      if (tipo === 'ninguno') {
        res.clearCookie('tipoPreferido');
        return res.redirect(303, '/equipos');
      }
      if (!TIPOS.includes(tipo)) {
        return res.status(400).render('error', {
          titulo: 'Error',
          mensaje: 'Tipo de equipo no válido.'
        });
      }
      res.cookie('tipoPreferido', tipo, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        httpOnly: true,
        sameSite: 'lax',
        secure: produccion
      });
      return res.redirect(303, '/equipos');
    }
  };
}
