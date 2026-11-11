// SERVICIO DE RESERVAS TIPADO
// Recibe el repositorio por inyección de dependencias (en el constructor)
import type { Equipo, Reserva, Turno, Usuario } from './modelos.js';
import type { RepositorioReservas } from './RepositorioReservas.js';
import { ErrorDominio } from './ErrorDominio.js';

export class ServicioReservas {
  private readonly repo: RepositorioReservas;
  private readonly equipos: Equipo[];

  constructor(repo: RepositorioReservas, equipos: Equipo[]) {
    this.repo = repo;
    this.equipos = equipos;
  }

  // ¿Hay una reserva activa de ese equipo, fecha y turno?
  estaReservado(equipoId: number, fecha: string, turno: Turno, reservas: Reserva[]): boolean {
    return reservas.some(r =>
      r.equipoId === equipoId && r.fecha === fecha &&
      r.turno === turno && r.estado === 'activa'
    );
  }

  // Equipos operativos y libres para esa fecha y turno
  async disponibles(fecha: string, turno: Turno): Promise<Equipo[]> {
    const reservas = await this.repo.listar();
    return this.equipos.filter(e =>
      e.estado === 'operativo' && !this.estaReservado(e.id, fecha, turno, reservas)
    );
  }

  async reservar(equipoId: number, usuario: Usuario, fecha: string, turno: Turno): Promise<Reserva> {
    const equipo = this.equipos.find(e => e.id === equipoId);
    if (!equipo) {
      throw new ErrorDominio('NO_ENCONTRADO', 'El equipo no existe.');
    }
    if (equipo.estado !== 'operativo') {
      throw new ErrorDominio('NO_DISPONIBLE', 'El equipo está fuera de servicio.');
    }
    const reservas = await this.repo.listar();
    if (this.estaReservado(equipoId, fecha, turno, reservas)) {
      throw new ErrorDominio('NO_DISPONIBLE', 'El equipo ya está reservado para ese turno.');
    }
    return this.repo.crear({
      equipoId, usuarioId: usuario.id, fecha, turno, estado: 'activa'
    });
  }

  // El usuario solo puede cancelar sus propias reservas activas
  async cancelar(reservaId: number, usuario: Usuario): Promise<Reserva> {
    const reserva = await this.repo.buscarPorId(reservaId);
    if (!reserva) {
      throw new ErrorDominio('NO_ENCONTRADO', 'La reserva no existe.');
    }
    if (usuario.rol !== 'admin' && reserva.usuarioId !== usuario.id) {
      throw new ErrorDominio('PROHIBIDO', 'No puedes cancelar una reserva de otro usuario.');
    }
    if (reserva.estado !== 'activa') {
      throw new ErrorDominio('NO_CANCELABLE', 'La reserva ya está cancelada.');
    }
    const cancelada: Reserva = { ...reserva, estado: 'cancelada' };
    await this.repo.guardar(cancelada);
    return cancelada;
  }
}
