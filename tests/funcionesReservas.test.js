// PRUEBAS DE LAS FUNCIONES DE RESERVA (sin peticiones HTTP)
import { describe, it, expect } from 'vitest';
import {
  estaReservado, obtenerEquiposDisponibles, validarReserva
} from '../src/services/funcionesReservas.js';

const equipos = [
  { id: 1, codigo: 'PC-001', tipo: 'sobremesa', estado: 'operativo' },
  { id: 2, codigo: 'PORT-001', tipo: 'portatil', estado: 'operativo' },
  { id: 3, codigo: 'PC-002', tipo: 'sobremesa', estado: 'fuera_de_servicio' }
];
const reservas = [
  { id: 1, equipoId: 1, usuarioId: 2, fecha: '2030-01-15', turno: 'manana', estado: 'activa' },
  { id: 2, equipoId: 2, usuarioId: 2, fecha: '2030-01-15', turno: 'manana', estado: 'cancelada' }
];

describe('Funciones de reserva', () => {
  it('estaReservado solo tiene en cuenta las reservas activas', () => {
    expect(estaReservado(1, '2030-01-15', 'manana', reservas)).toBe(true);
    expect(estaReservado(1, '2030-01-15', 'tarde', reservas)).toBe(false);
    expect(estaReservado(2, '2030-01-15', 'manana', reservas)).toBe(false);
  });

  it('obtenerEquiposDisponibles quita los reservados y los fuera de servicio', () => {
    const disponibles = obtenerEquiposDisponibles(equipos, reservas, '2030-01-15', 'manana');
    expect(disponibles.length).toBe(1);
    expect(disponibles[0].codigo).toBe('PORT-001');
  });

  it('validarReserva convierte los datos correctos y detecta los errores', () => {
    const correcta = validarReserva({ equipoId: '2', fecha: '2030-01-15', turno: 'tarde' });
    expect(correcta.errores).toEqual({});
    expect(correcta.valores.equipoId).toBe(2);

    const incorrecta = validarReserva({ equipoId: 'x', fecha: '2020-01-01', turno: 'noche' });
    expect(incorrecta.errores.equipoId).toBeDefined();
    expect(incorrecta.errores.fecha).toBeDefined();
    expect(incorrecta.errores.turno).toBeDefined();

    const noExiste = validarReserva({ equipoId: '1', fecha: '2030-02-30', turno: 'manana' });
    expect(noExiste.errores.fecha).toBeDefined();
  });
});
