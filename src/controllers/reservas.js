// CONTROLADOR DE RESERVAS — Formulario, creación, mis reservas y cancelación
import { ErrorDominio } from '../services/errores.js';
import {
  fechaHoy, validarFechaTurno, validarReserva
} from '../services/funcionesReservas.js';
import { enteroPositivo } from './validaciones.js';
import { estados } from '../routes/middleware.js';

// MODELO DE VISTA del formulario de reserva (sesión 11):
// reúne solo lo que necesita la página.
function crearFormularioVM(equipos, valores, errores, csrfToken) {
  return {
    titulo: 'Nueva reserva',
    hoy: fechaHoy(),
    csrfToken,
    // Opciones del select: solo los equipos disponibles
    equipos: equipos.map(e => ({
      valor: String(e.id),
      texto: `${e.codigo} · ${e.nombre}`
    })),
    turnos: [
      { valor: 'manana', texto: 'Mañana' },
      { valor: 'tarde', texto: 'Tarde' }
    ],
    // Valores en texto para marcar la opción elegida
    valores: {
      equipoId: String(valores.equipoId ?? ''),
      fecha: valores.fecha,
      turno: valores.turno
    },
    errores: Object.values(errores),
    fechaTurnoValidos: !errores.fecha && !errores.turno
  };
}

export function crearControladorReservas(servicio) {
  // Prepara el modelo de vista y muestra el formulario con el código indicado
  async function mostrar(res, valores, errores, codigo) {
    let equipos = [];
    if (!errores.fecha && !errores.turno) {
      equipos = await servicio.disponibles(valores.fecha, valores.turno);
    }
    const vm = crearFormularioVM(equipos, valores, errores, res.locals.csrfToken);
    return res.status(codigo).render('reservas/nueva', { vm });
  }

  return {
    // GET /reservas/nueva?fecha=AAAA-MM-DD&turno=manana
    // Muestra los equipos disponibles para esa fecha y turno
    async mostrarFormulario(req, res, next) {
      try {
        const fecha = String(req.query.fecha ?? fechaHoy());
        const turno = String(req.query.turno ?? 'manana');
        const errores = validarFechaTurno(fecha, turno);
        const codigo = Object.keys(errores).length > 0 ? 400 : 200;
        return await mostrar(res, { equipoId: '', fecha, turno }, errores, codigo);
      } catch (err) {
        return next(err);
      }
    },

    // POST /reservas — el usuario sale de la sesión, nunca del formulario
    async crear(req, res, next) {
      try {
        const { valores, errores } = validarReserva(req.body);
        // Para volver a rellenar el formulario si hay un error
        const valoresTexto = {
          equipoId: String(req.body.equipoId ?? ''),
          fecha: valores.fecha,
          turno: valores.turno
        };

        if (Object.keys(errores).length > 0) {
          return await mostrar(res, valoresTexto, errores, 400);
        }

        try {
          await servicio.crear(valores.equipoId, valores.fecha, valores.turno,
            res.locals.usuarioActual.id);
        } catch (err) {
          // Error previsto (409 ya reservado, 404 no existe...): se repite el formulario
          if (err instanceof ErrorDominio) {
            return await mostrar(res, valoresTexto, { general: err.message }, estados[err.codigo]);
          }
          throw err;
        }

        // Patrón PRG: aviso en la sesión y redirección 303
        req.session.aviso = 'Reserva creada correctamente.';
        req.session.save(err => {
          if (err) return next(err);
          return res.redirect(303, '/mis-reservas');
        });
      } catch (err) {
        return next(err);
      }
    },

    // GET /mis-reservas
    async misReservas(req, res, next) {
      try {
        const reservas = await servicio.listarDeUsuario(res.locals.usuarioActual.id);
        return res.render('reservas/mias', { titulo: 'Mis reservas', reservas });
      } catch (err) {
        return next(err);
      }
    },

    // POST /reservas/:id/cancelar — el servicio comprueba que la reserva es suya
    async cancelar(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'reserva');
        await servicio.cancelarPropia(id, res.locals.usuarioActual.id);
        req.session.aviso = 'Reserva cancelada.';
        req.session.save(err => {
          if (err) return next(err);
          return res.redirect(303, '/mis-reservas');
        });
      } catch (err) {
        return next(err);
      }
    }
  };
}
