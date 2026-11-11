// REPOSITORIO DE RESERVAS — Acceso a la colección en memoria (sesión 10)
// Las reservas nunca se borran: cancelar = guardar con estado 'cancelada'.
export function crearRepositorioReservas(iniciales = []) {
  const datos = new Map(iniciales.map(r => [r.id, { ...r }]));
  let siguienteId = iniciales.length + 1;

  return {
    async listar() {
      return [...datos.values()].map(r => ({ ...r }));
    },
    async buscarPorId(id) {
      const reserva = datos.get(id);
      return reserva ? { ...reserva } : undefined;
    },
    async crear(reserva) {
      const nueva = { ...reserva, id: siguienteId };
      siguienteId++;
      datos.set(nueva.id, nueva);
      return { ...nueva };
    },
    async guardar(reserva) {
      if (!datos.has(reserva.id)) {
        throw new Error('No existe el registro que actualizar');
      }
      datos.set(reserva.id, { ...reserva });
    }
  };
}
