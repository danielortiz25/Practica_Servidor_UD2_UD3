// SERVICIO DE RESERVAS — Disponibilidad, conflictos y cancelaciones
// Las reglas de negocio están aquí (apartado 4), no en rutas ni vistas.
import { ErrorDominio } from './errores.js';
import {
  fechaHoy, estaReservado, obtenerEquiposDisponibles, validarFechaTurno
} from './funcionesReservas.js';

export function crearServicioReservas(repoReservas, repoEquipos, repoUsuarios) {
  return {
    // Equipos que se pueden reservar en esa fecha y turno
    async disponibles(fecha, turno) {
      const equipos = await repoEquipos.listar();
      const reservas = await repoReservas.listar();
      return obtenerEquiposDisponibles(equipos, reservas, fecha, turno);
    },

    // Crear reserva: se repiten TODAS las comprobaciones aunque el formulario
    // solo ofrezca opciones válidas
    async crear(equipoId, fecha, turno, usuarioId) {
      const errores = validarFechaTurno(fecha, turno);
      if (Object.keys(errores).length > 0) {
        throw new ErrorDominio('DATOS_INVALIDOS', 'La fecha o el turno no son válidos.');
      }
      const equipo = await repoEquipos.buscarPorId(equipoId);
      if (!equipo) {
        throw new ErrorDominio('NO_ENCONTRADO', 'El equipo no existe.');
      }
      if (equipo.estado !== 'operativo') {
        throw new ErrorDominio('NO_DISPONIBLE', 'El equipo está fuera de servicio.');
      }
      const reservas = await repoReservas.listar();
      if (estaReservado(equipoId, fecha, turno, reservas)) {
        throw new ErrorDominio('NO_DISPONIBLE', 'El equipo ya está reservado para ese turno.');
      }
      return repoReservas.crear({ equipoId, usuarioId, fecha, turno, estado: 'activa' });
    },

    // Reservas de un usuario (activas y canceladas) con el nombre del equipo
    async listarDeUsuario(usuarioId) {
      const reservas = await repoReservas.listar();
      const equipos = await repoEquipos.listar();
      const hoy = fechaHoy();
      return reservas
        .filter(r => r.usuarioId === usuarioId)
        .map(r => {
          const equipo = equipos.find(e => e.id === r.equipoId);
          return {
            ...r,
            equipoNombre: equipo ? `${equipo.codigo} · ${equipo.nombre}` : '',
            cancelable: r.estado === 'activa' && r.fecha >= hoy
          };
        });
    },

    // Cancelación del usuario: solo sus reservas, activas y no pasadas
    async cancelarPropia(reservaId, usuarioId) {
      const reserva = await repoReservas.buscarPorId(reservaId);
      if (!reserva) {
        throw new ErrorDominio('NO_ENCONTRADO', 'La reserva no existe.');
      }
      if (reserva.usuarioId !== usuarioId) {
        throw new ErrorDominio('PROHIBIDO', 'No puedes cancelar una reserva de otro usuario.');
      }
      if (reserva.estado !== 'activa' || reserva.fecha < fechaHoy()) {
        throw new ErrorDominio('NO_CANCELABLE', 'Esta reserva ya no se puede cancelar.');
      }
      // No se borra: solo cambia el estado
      reserva.estado = 'cancelada';
      await repoReservas.guardar(reserva);
    },

    // Administración: todas las reservas con equipo y usuario
    async listarTodas() {
      const reservas = await repoReservas.listar();
      const equipos = await repoEquipos.listar();
      const usuarios = await repoUsuarios.listar();
      return reservas.map(r => {
        const equipo = equipos.find(e => e.id === r.equipoId);
        const usuario = usuarios.find(u => u.id === r.usuarioId);
        return {
          ...r,
          equipoNombre: equipo ? `${equipo.codigo} · ${equipo.nombre}` : '',
          usuarioNombre: usuario ? `${usuario.nombre} (${usuario.email})` : ''
        };
      });
    },

    // El administrador puede cancelar cualquier reserva activa
    async cancelarAdmin(reservaId) {
      const reserva = await repoReservas.buscarPorId(reservaId);
      if (!reserva) {
        throw new ErrorDominio('NO_ENCONTRADO', 'La reserva no existe.');
      }
      if (reserva.estado !== 'activa') {
        throw new ErrorDominio('NO_CANCELABLE', 'La reserva ya está cancelada.');
      }
      reserva.estado = 'cancelada';
      await repoReservas.guardar(reserva);
    }
  };
}
