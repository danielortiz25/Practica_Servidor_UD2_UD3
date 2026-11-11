// SERVICIO DE USUARIOS — Registro y comprobación de credenciales (sesión 8)
// No usa req, res ni EJS y nunca devuelve el hash de la contraseña.
import bcrypt from 'bcrypt';
import { ErrorDominio } from './errores.js';

// Datos que se pueden mostrar (sin passwordHash)
function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol
  };
}

export function crearServicioUsuarios(repo) {
  return {
    async buscarPorId(id) {
      const usuario = await repo.buscarPorId(id);
      return usuario ? usuarioPublico(usuario) : null;
    },

    // Registro público: el rol SIEMPRE es 'usuario'
    async registrar(nombre, email, password) {
      const existente = await repo.buscarPorEmail(email);
      if (existente) {
        throw new ErrorDominio('DUPLICADO', 'No se puede crear la cuenta con ese correo.');
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const nuevo = await repo.crear({ nombre, email, passwordHash, rol: 'usuario' });
      return usuarioPublico(nuevo);
    },

    // Devuelve el usuario si las credenciales son correctas o null si no.
    // No se distingue si falla el correo o la contraseña.
    async autenticar(email, password) {
      const usuario = await repo.buscarPorEmail(email);
      const coincide = usuario
        ? await bcrypt.compare(password, usuario.passwordHash)
        : false;
      return coincide ? usuarioPublico(usuario) : null;
    }
  };
}
