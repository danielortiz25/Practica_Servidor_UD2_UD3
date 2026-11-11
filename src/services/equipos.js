// SERVICIO DE EQUIPOS — Catálogo, ficha y gestión del administrador
import { ErrorDominio } from './errores.js';
import { fechaHoy } from './funcionesReservas.js';

export function crearServicioEquipos(repoEquipos, repoReservas) {
  return {
    // Filtros del catálogo: tipo ('todos', 'portatil', 'sobremesa') y solo operativos
    async listar(tipo, soloOperativos) {
      const equipos = await repoEquipos.listar();
      return equipos.filter(e => {
        if (tipo !== 'todos' && e.tipo !== tipo) return false;
        if (soloOperativos && e.estado !== 'operativo') return false;
        return true;
      });
    },

    // Ficha: el equipo y los turnos que ya tiene reservados desde hoy
    async ficha(id) {
      const equipo = await repoEquipos.buscarPorId(id);
      if (!equipo) {
        throw new ErrorDominio('NO_ENCONTRADO', 'El equipo no existe.');
      }
      const reservas = await repoReservas.listar();
      const ocupados = reservas.filter(r =>
        r.equipoId === id && r.estado === 'activa' && r.fecha >= fechaHoy()
      );
      return { equipo, ocupados };
    },

    async crear(codigo, nombre, tipo) {
      const existente = await repoEquipos.buscarPorCodigo(codigo);
      if (existente) {
        throw new ErrorDominio('DUPLICADO', 'Ya existe un equipo con ese código.');
      }
      return repoEquipos.crear({ codigo, nombre, tipo, estado: 'operativo' });
    },

    async cambiarEstado(id, estado) {
      if (estado !== 'operativo' && estado !== 'fuera_de_servicio') {
        throw new ErrorDominio('DATOS_INVALIDOS', 'Estado no válido.');
      }
      const equipo = await repoEquipos.buscarPorId(id);
      if (!equipo) {
        throw new ErrorDominio('NO_ENCONTRADO', 'El equipo no existe.');
      }
      equipo.estado = estado;
      await repoEquipos.guardar(equipo);
    }
  };
}
