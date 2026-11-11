// CONTRATO DEL REPOSITORIO DE RESERVAS (interfaz)
import type { NuevaReserva, Reserva } from './modelos.js';

export interface RepositorioReservas {
  listar(): Promise<Reserva[]>;
  buscarPorId(id: number): Promise<Reserva | undefined>;
  crear(datos: NuevaReserva): Promise<Reserva>;
  guardar(reserva: Reserva): Promise<void>;
}
