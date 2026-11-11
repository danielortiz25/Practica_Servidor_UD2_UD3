// FUNCIONES DE RESERVA — Obligatorias (apartado 6)
// No dependen de req ni de res y están fuera de los controladores.

export const TURNOS = ['manana', 'tarde'];
export const TIPOS = ['portatil', 'sobremesa'];

// Fecha de hoy como texto AAAA-MM-DD
export function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

// Comprueba que el texto es una fecha que existe (rechaza 2027-02-30)
export function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }
  const comprobada = new Date(fecha);
  if (Number.isNaN(comprobada.getTime())) {
    return false;
  }
  // Si la fecha no existe, Date la cambia (30 de febrero → 2 de marzo)
  return comprobada.toISOString().slice(0, 10) === fecha;
}

// ¿Hay una reserva ACTIVA de ese equipo, fecha y turno?
// Una reserva cancelada no cuenta.
export function estaReservado(equipoId, fecha, turno, reservas) {
  return reservas.some(r =>
    r.equipoId === equipoId &&
    r.fecha === fecha &&
    r.turno === turno &&
    r.estado === 'activa'
  );
}

// Equipos operativos que no están reservados en esa fecha y turno
export function obtenerEquiposDisponibles(equipos, reservas, fecha, turno) {
  return equipos.filter(e =>
    e.estado === 'operativo' && !estaReservado(e.id, fecha, turno, reservas)
  );
}

// Comprueba fecha y turno. Devuelve un objeto con los errores encontrados.
export function validarFechaTurno(fecha, turno) {
  const errores = {};
  if (!esFechaValida(fecha)) {
    errores.fecha = 'Introduce una fecha válida.';
  } else if (fecha < fechaHoy()) {
    // Las fechas AAAA-MM-DD se pueden comparar como texto
    errores.fecha = 'La fecha no puede ser anterior a hoy.';
  }
  if (!TURNOS.includes(turno)) {
    errores.turno = 'El turno debe ser mañana o tarde.';
  }
  return errores;
}

// Valida y convierte los datos del formulario de reserva.
// Recibe textos (como llegan en req.body) y devuelve { valores, errores }.
export function validarReserva(datos) {
  const equipoTexto = String(datos.equipoId ?? '');
  const fecha = String(datos.fecha ?? '').trim();
  const turno = String(datos.turno ?? '');

  const errores = validarFechaTurno(fecha, turno);

  // El id del equipo llega como texto: se comprueba y se convierte a número
  let equipoId = null;
  if (/^[1-9]\d*$/.test(equipoTexto)) {
    equipoId = Number(equipoTexto);
  } else {
    errores.equipoId = 'Selecciona un equipo válido.';
  }

  return { valores: { equipoId, fecha, turno }, errores };
}
