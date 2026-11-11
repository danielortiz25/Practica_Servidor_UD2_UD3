// DATOS INICIALES — Colecciones en memoria al arrancar (apartado 1)
// Al menos 3 equipos, 3 reservas y 3 usuarios (uno admin).
// Solo los repositorios usan estos arrays.
import bcrypt from 'bcrypt';

export const equipos = [
  { id: 1, codigo: 'PC-001', nombre: 'Ordenador aula 1', tipo: 'sobremesa', estado: 'operativo' },
  { id: 2, codigo: 'PORT-001', nombre: 'Portátil Lenovo', tipo: 'portatil', estado: 'operativo' },
  { id: 3, codigo: 'PC-002', nombre: 'Ordenador aula 2', tipo: 'sobremesa', estado: 'fuera_de_servicio' }
];

export const reservas = [
  { id: 1, equipoId: 1, usuarioId: 2, fecha: '2027-01-15', turno: 'manana', estado: 'activa' },
  { id: 2, equipoId: 2, usuarioId: 3, fecha: '2027-01-15', turno: 'tarde', estado: 'activa' },
  { id: 3, equipoId: 1, usuarioId: 2, fecha: '2027-01-20', turno: 'tarde', estado: 'cancelada' }
];

// Contraseñas de prueba (están en el README). Solo se guarda el hash (sesión 8).
export const usuarios = [
  {
    id: 1, nombre: 'Administrador', email: 'admin@example.com',
    passwordHash: await bcrypt.hash('admin1234', 12), rol: 'admin'
  },
  {
    id: 2, nombre: 'Ana García', email: 'ana@example.com',
    passwordHash: await bcrypt.hash('ana12345', 12), rol: 'usuario'
  },
  {
    id: 3, nombre: 'Luis Pérez', email: 'luis@example.com',
    passwordHash: await bcrypt.hash('luis12345', 12), rol: 'usuario'
  }
];
