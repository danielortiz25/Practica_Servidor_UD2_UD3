// CONTROLADOR DE ADMINISTRACIÓN — Equipos y reservas (solo rol admin)
import { ErrorDominio } from '../services/errores.js';
import { enteroPositivo, normalizarEquipo, validarEquipo } from './validaciones.js';

export function crearControladorAdmin(servicioEquipos, servicioReservas) {
  // Muestra la página de equipos con el formulario de alta
  async function mostrarEquipos(res, valores, errores, codigo) {
    const equipos = await servicioEquipos.listar('todos', false);
    return res.status(codigo).render('admin/equipos', {
      titulo: 'Administrar equipos', equipos, valores, errores
    });
  }

  return {
    // GET /admin/equipos
    async equipos(req, res, next) {
      try {
        return await mostrarEquipos(res, { codigo: '', nombre: '', tipo: '' }, {}, 200);
      } catch (err) {
        return next(err);
      }
    },

    // POST /admin/equipos — alta de un equipo
    async crearEquipo(req, res, next) {
      try {
        const valores = normalizarEquipo(req.body);
        const errores = validarEquipo(valores);
        if (Object.keys(errores).length > 0) {
          return await mostrarEquipos(res, valores, errores, 400);
        }
        try {
          await servicioEquipos.crear(valores.codigo, valores.nombre, valores.tipo);
        } catch (err) {
          if (err instanceof ErrorDominio && err.codigo === 'DUPLICADO') {
            return await mostrarEquipos(res, valores, { codigo: err.message }, 409);
          }
          throw err;
        }
        req.session.aviso = 'Equipo añadido.';
        req.session.save(err => {
          if (err) return next(err);
          return res.redirect(303, '/admin/equipos');
        });
      } catch (err) {
        return next(err);
      }
    },

    // POST /admin/equipos/:id/estado
    async cambiarEstado(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'equipo');
        const estado = String(req.body.estado ?? '');
        await servicioEquipos.cambiarEstado(id, estado);
        req.session.aviso = 'Estado del equipo actualizado.';
        req.session.save(err => {
          if (err) return next(err);
          return res.redirect(303, '/admin/equipos');
        });
      } catch (err) {
        return next(err);
      }
    },

    // GET /admin/reservas
    async reservas(req, res, next) {
      try {
        const reservas = await servicioReservas.listarTodas();
        return res.render('admin/reservas', { titulo: 'Todas las reservas', reservas });
      } catch (err) {
        return next(err);
      }
    },

    // POST /admin/reservas/:id/cancelar
    async cancelarReserva(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'reserva');
        await servicioReservas.cancelarAdmin(id);
        req.session.aviso = 'Reserva cancelada.';
        req.session.save(err => {
          if (err) return next(err);
          return res.redirect(303, '/admin/reservas');
        });
      } catch (err) {
        return next(err);
      }
    }
  };
}
