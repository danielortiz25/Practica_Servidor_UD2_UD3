// CONTROLADOR DE AUTENTICACIÓN — Registro, login, logout y perfil (sesión 8)
import { ErrorDominio } from '../services/errores.js';
import { normalizarRegistro, validarRegistro, normalizarLogin } from './validaciones.js';

export function crearControladorAuth(servicioUsuarios, produccion) {
  return {
    // GET /registro
    mostrarRegistro(req, res) {
      return res.render('auth/registro', {
        titulo: 'Registro',
        valores: { nombre: '', email: '' },
        errores: {}
      });
    },

    // POST /registro
    async registrar(req, res, next) {
      const valores = normalizarRegistro(req.body);
      const errores = validarRegistro(valores);
      // La contraseña nunca se vuelve a mostrar
      const visibles = { nombre: valores.nombre, email: valores.email };

      if (Object.keys(errores).length > 0) {
        return res.status(400).render('auth/registro', {
          titulo: 'Registro', valores: visibles, errores
        });
      }
      try {
        // El servicio asigna siempre el rol 'usuario'
        await servicioUsuarios.registrar(valores.nombre, valores.email, valores.password);
        req.session.aviso = 'Cuenta creada. Ya puedes iniciar sesión.';
        req.session.save(err => {
          if (err) return next(err);
          return res.redirect(303, '/login');
        });
      } catch (err) {
        if (err instanceof ErrorDominio && err.codigo === 'DUPLICADO') {
          return res.status(400).render('auth/registro', {
            titulo: 'Registro', valores: visibles, errores: { email: err.message }
          });
        }
        return next(err);
      }
    },

    // GET /login
    mostrarLogin(req, res) {
      return res.render('auth/login', {
        titulo: 'Iniciar sesión',
        valores: { email: '' },
        error: null
      });
    },

    // POST /login
    async login(req, res, next) {
      try {
        const { email, password } = normalizarLogin(req.body);
        const usuario = await servicioUsuarios.autenticar(email, password);

        // Mismo mensaje si el correo no existe o la contraseña no coincide
        if (!usuario) {
          return res.status(401).render('auth/login', {
            titulo: 'Iniciar sesión',
            valores: { email },
            error: 'Credenciales no válidas.'
          });
        }

        // Nuevo identificador de sesión y solo se guarda el id del usuario
        req.session.regenerate(err => {
          if (err) return next(err);
          req.session.usuarioId = usuario.id;
          req.session.save(errGuardar => {
            if (errGuardar) return next(errGuardar);
            return res.redirect(303, '/perfil');
          });
        });
      } catch (err) {
        return next(err);
      }
    },

    // POST /logout — destruye la sesión y retira la cookie
    logout(req, res, next) {
      req.session.destroy(err => {
        if (err) return next(err);
        res.clearCookie('reservas.sid', {
          httpOnly: true,
          sameSite: 'lax',
          secure: produccion
        });
        return res.redirect(303, '/login');
      });
    },

    // GET /perfil (protegida)
    perfil(req, res) {
      return res.render('auth/perfil', {
        titulo: 'Mi perfil',
        usuario: res.locals.usuarioActual
      });
    }
  };
}
