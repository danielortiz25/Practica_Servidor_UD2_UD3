// DEMOSTRACIÓN DEL NÚCLEO TIPADO (como demo.ts de la sesión 11)
// npx tsc && node dist/demo.js
import { RepositorioReservasMemoria } from './RepositorioReservasMemoria.js';
import { ServicioReservas } from './ServicioReservas.js';
import { ErrorDominio } from './ErrorDominio.js';
import type { Equipo, Usuario } from './modelos.js';

const equipos: Equipo[] = [
  { id: 1, codigo: 'PC-001', nombre: 'Ordenador aula 1', tipo: 'sobremesa', estado: 'operativo' },
  { id: 2, codigo: 'PORT-001', nombre: 'Portátil Lenovo', tipo: 'portatil', estado: 'operativo' }
];
const ana: Usuario = { id: 2, nombre: 'Ana', email: 'ana@example.com', passwordHash: '-', rol: 'usuario' };
const luis: Usuario = { id: 3, nombre: 'Luis', email: 'luis@example.com', passwordHash: '-', rol: 'usuario' };

const repo = new RepositorioReservasMemoria();
const servicio = new ServicioReservas(repo, equipos);

// 1. Ana reserva el PC-001 por la mañana
const reserva = await servicio.reservar(1, ana, '2027-01-15', 'manana');
console.log('Reserva creada con id', reserva.id);

// 2. Luis intenta reservar el mismo equipo, fecha y turno
try {
  await servicio.reservar(1, luis, '2027-01-15', 'manana');
} catch (err) {
  if (err instanceof ErrorDominio) console.log('Luis no puede reservar:', err.codigo);
}

// 3. Luis intenta cancelar la reserva de Ana
try {
  await servicio.cancelar(reserva.id, luis);
} catch (err) {
  if (err instanceof ErrorDominio) console.log('Luis no puede cancelar:', err.codigo);
}

// 4. Ana cancela su reserva y el equipo vuelve a estar libre
await servicio.cancelar(reserva.id, ana);
const libres = await servicio.disponibles('2027-01-15', 'manana');
console.log('Disponibles:', libres.map(e => e.codigo));
