// REPOSITORIO DE RESERVAS CON Map — clase que cumple la interfaz
import type { NuevaReserva, Reserva } from './modelos.js';
import type { RepositorioReservas } from './RepositorioReservas.js';

export class RepositorioReservasMemoria implements RepositorioReservas {
  private readonly datos: Map<number, Reserva>;
  private siguienteId: number;

  constructor(iniciales: Reserva[] = []) {
    this.datos = new Map(iniciales.map(r => [r.id, { ...r }]));
    this.siguienteId = iniciales.length + 1;
  }

  async listar(): Promise<Reserva[]> {
    return [...this.datos.values()].map(r => ({ ...r }));
  }

  async buscarPorId(id: number): Promise<Reserva | undefined> {
    const reserva = this.datos.get(id);
    return reserva ? { ...reserva } : undefined;
  }

  async crear(datos: NuevaReserva): Promise<Reserva> {
    const nueva: Reserva = { ...datos, id: this.siguienteId };
    this.siguienteId++;
    this.datos.set(nueva.id, nueva);
    return { ...nueva };
  }

  async guardar(reserva: Reserva): Promise<void> {
    if (!this.datos.has(reserva.id)) {
      throw new Error('No existe el registro que actualizar');
    }
    this.datos.set(reserva.id, { ...reserva });
  }
}
