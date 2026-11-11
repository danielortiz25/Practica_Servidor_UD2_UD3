// REPOSITORIO DE EQUIPOS — Acceso a la colección en memoria (sesión 10)
// Se guarda en un Map por id y se devuelven copias.
export function crearRepositorioEquipos(iniciales = []) {
  const datos = new Map(iniciales.map(e => [e.id, { ...e }]));
  let siguienteId = iniciales.length + 1;

  return {
    async listar() {
      return [...datos.values()].map(e => ({ ...e }));
    },
    async buscarPorId(id) {
      const equipo = datos.get(id);
      return equipo ? { ...equipo } : undefined;
    },
    async buscarPorCodigo(codigo) {
      const equipos = [...datos.values()];
      const equipo = equipos.find(e => e.codigo === codigo);
      return equipo ? { ...equipo } : undefined;
    },
    async crear(equipo) {
      const nuevo = { ...equipo, id: siguienteId };
      siguienteId++;
      datos.set(nuevo.id, nuevo);
      return { ...nuevo };
    },
    async guardar(equipo) {
      if (!datos.has(equipo.id)) {
        throw new Error('No existe el registro que actualizar');
      }
      datos.set(equipo.id, { ...equipo });
    }
  };
}
