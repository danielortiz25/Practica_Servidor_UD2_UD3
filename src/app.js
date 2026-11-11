// APP.JS — Crea y configura la aplicación (sin listen, para las pruebas)
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { equipos, reservas, usuarios } from './repositories/datos.js';
import { crearRepositorioEquipos } from './repositories/equipos.js';
import { crearRepositorioReservas } from './repositories/reservas.js';
import { crearRepositorioUsuarios } from './repositories/usuarios.js';
import { crearServicioEquipos } from './services/equipos.js';
import { crearServicioReservas } from './services/reservas.js';
import { crearServicioUsuarios } from './services/usuarios.js';
import { crearControladorEquipos } from './controllers/equipos.js';
import { crearControladorAuth } from './controllers/auth.js';
import { crearControladorReservas } from './controllers/reservas.js';
import { crearControladorAdmin } from './controllers/admin.js';
import { crearRutasEquipos } from './routes/equipos.js';
import { crearRutasAuth } from './routes/auth.js';
import { crearRutasReservas } from './routes/reservas.js';
import { crearRutasAdmin } from './routes/admin.js';
import {
  crearCargarUsuarioActual, prepararCsrf, mostrarAviso, noEncontrado, tratarError
} from './routes/middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// ---------- 1. VISTAS EJS ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ---------- 2. FORMULARIOS, COOKIES Y ARCHIVOS ESTÁTICOS ----------
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- 3. SESIÓN DEL SERVIDOR (sesiones 7 y 9) ----------
if (config.produccion) app.set('trust proxy', 1);

app.use(session({
  name: 'reservas.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.produccion,
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000 // 30 minutos
  }
}));

// ---------- 4. COMPOSICIÓN: repositorios → servicios → controladores ----------
const repoEquipos = crearRepositorioEquipos(equipos);
const repoReservas = crearRepositorioReservas(reservas);
const repoUsuarios = crearRepositorioUsuarios(usuarios);

const servicioEquipos = crearServicioEquipos(repoEquipos, repoReservas);
const servicioReservas = crearServicioReservas(repoReservas, repoEquipos, repoUsuarios);
const servicioUsuarios = crearServicioUsuarios(repoUsuarios);

const controladorEquipos = crearControladorEquipos(servicioEquipos, config.produccion);
const controladorAuth = crearControladorAuth(servicioUsuarios, config.produccion);
const controladorReservas = crearControladorReservas(servicioReservas);
const controladorAdmin = crearControladorAdmin(servicioEquipos, servicioReservas);

// ---------- 5. MIDDLEWARE COMUNES (el orden importa) ----------
app.use(crearCargarUsuarioActual(servicioUsuarios)); // res.locals.usuarioActual
app.use(prepararCsrf);                               // res.locals.csrfToken
app.use(mostrarAviso);                               // res.locals.aviso

// ---------- 6. RUTAS ----------
app.get('/', (req, res) => {
  return res.render('inicio', { titulo: 'Reserva de equipos' });
});
app.use(crearRutasEquipos(controladorEquipos));
app.use(crearRutasAuth(controladorAuth));
app.use(crearRutasReservas(controladorReservas));
app.use(crearRutasAdmin(controladorAdmin));

// ---------- 7. ERRORES (siempre al final) ----------
app.use(noEncontrado);
app.use(tratarError);
