// MODELOS TIPADOS — Interfaces y tipos unión (apartado 6, TypeScript)

// Tipos unión: solo admiten estos valores
export type Rol = 'usuario' | 'admin';
export type Turno = 'manana' | 'tarde';
export type EstadoReserva = 'activa' | 'cancelada';
export type EstadoEquipo = 'operativo' | 'fuera_de_servicio';
export type TipoEquipo = 'portatil' | 'sobremesa';

export interface Equipo {
  readonly id: number;
  codigo: string;
  nombre: string;
  tipo: TipoEquipo;
  estado: EstadoEquipo;
}

export interface Reserva {
  readonly id: number;
  equipoId: number;
  usuarioId: number;
  fecha: string; // AAAA-MM-DD
  turno: Turno;
  estado: EstadoReserva;
}

export interface Usuario {
  readonly id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
}

// Datos para crear una reserva (el id lo pone el repositorio)
export interface NuevaReserva {
  equipoId: number;
  usuarioId: number;
  fecha: string;
  turno: Turno;
  estado: EstadoReserva;
}
