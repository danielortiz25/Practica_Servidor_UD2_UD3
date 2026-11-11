// REPOSITORIO DE USUARIOS — Acceso a la colección en memoria (sesión 10)
export function crearRepositorioUsuarios(iniciales = []) {
  const datos = new Map(iniciales.map(u => [u.id, { ...u }]));
  let siguienteId = iniciales.length + 1;

  return {
    async listar() {
      return [...datos.values()].map(u => ({ ...u }));
    },
    async buscarPorId(id) {
      const usuario = datos.get(id);
      return usuario ? { ...usuario } : undefined;
    },
    async buscarPorEmail(email) {
      const usuarios = [...datos.values()];
      const usuario = usuarios.find(u => u.email === email);
      return usuario ? { ...usuario } : undefined;
    },
    async crear(usuario) {
      const nuevo = { ...usuario, id: siguienteId };
      siguienteId++;
      datos.set(nuevo.id, nuevo);
      return { ...nuevo };
    }
  };
}
