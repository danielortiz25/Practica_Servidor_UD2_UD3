// PRUEBAS CON VITEST Y SUPERTEST (apartado 8 y sesión 9)
// Supertest envía las peticiones directamente a app: no hace falta arrancar el servidor.
// request.agent conserva las cookies entre peticiones (mantiene la sesión).
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

// Fechas futuras que no coinciden con las reservas iniciales
const ANIO = new Date().getFullYear() + 2;
const FECHA = `${ANIO}-03-10`;
const OTRA_FECHA = `${ANIO}-04-20`;

// Saca el token CSRF del campo oculto _csrf de una página
function extraerCsrf(html) {
  const resultado = html.match(/name="_csrf" value="([^"]+)"/);
  return resultado ? resultado[1] : '';
}

// Inicia sesión con un agente y devuelve su token CSRF
async function entrar(agente, email, password) {
  await agente.post('/login').type('form').send({ email, password }).expect(303);
  const perfil = await agente.get('/perfil').expect(200);
  return extraerCsrf(perfil.text);
}

// Un agente por usuario de prueba
const ana = request.agent(app);
const luis = request.agent(app);
const admin = request.agent(app);
let csrfAna, csrfLuis, csrfAdmin;

beforeAll(async () => {
  csrfAna = await entrar(ana, 'ana@example.com', 'ana12345');
  csrfLuis = await entrar(luis, 'luis@example.com', 'luis12345');
  csrfAdmin = await entrar(admin, 'admin@example.com', 'admin1234');
});

describe('Registro y autenticación', () => {
  it('1. registra un usuario válido', async () => {
    const respuesta = await request(app).post('/registro').type('form').send({
      nombre: 'Marta López', email: 'marta@example.com', password: 'marta1234'
    });
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.location).toBe('/login');

    // Puede iniciar sesión con la cuenta nueva
    const marta = request.agent(app);
    await entrar(marta, 'marta@example.com', 'marta1234');
  });

  it('2. rechaza credenciales incorrectas con 401 y el mismo mensaje', async () => {
    const claveMala = await request(app).post('/login').type('form')
      .send({ email: 'ana@example.com', password: 'incorrecta' });
    const correoMalo = await request(app).post('/login').type('form')
      .send({ email: 'nadie@example.com', password: 'incorrecta' });

    expect(claveMala.status).toBe(401);
    expect(correoMalo.status).toBe(401);
    expect(claveMala.text).toContain('Credenciales no válidas.');
    expect(correoMalo.text).toContain('Credenciales no válidas.');
  });

  it('3. redirige al login si se entra sin sesión en una ruta privada', async () => {
    const respuesta = await request(app).get('/perfil');
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.location).toBe('/login');
  });

  it('4. permite entrar en una ruta privada con sesión', async () => {
    const respuesta = await ana.get('/perfil');
    expect(respuesta.status).toBe(200);
    expect(respuesta.text).toContain('Ana García');
  });

  it('el registro público siempre asigna el rol usuario', async () => {
    await request(app).post('/registro').type('form').send({
      nombre: 'Pirata', email: 'pirata@example.com', password: 'pirata123', rol: 'admin'
    }).expect(303);

    const pirata = request.agent(app);
    await entrar(pirata, 'pirata@example.com', 'pirata123');
    await pirata.get('/admin/equipos').expect(403);
  });
});

describe('Administración', () => {
  it('5. un usuario normal no puede hacer operaciones de administrador', async () => {
    const alta = await ana.post('/admin/equipos').type('form')
      .send({ _csrf: csrfAna, codigo: 'PC-999', nombre: 'Intruso', tipo: 'sobremesa' });
    expect(alta.status).toBe(403);

    const estado = await ana.post('/admin/equipos/1/estado').type('form')
      .send({ _csrf: csrfAna, estado: 'fuera_de_servicio' });
    expect(estado.status).toBe(403);
  });

  it('el administrador añade un equipo y cambia el estado de otro', async () => {
    await admin.post('/admin/equipos').type('form')
      .send({ _csrf: csrfAdmin, codigo: 'PC-003', nombre: 'Ordenador aula 3', tipo: 'sobremesa' })
      .expect(303);
    await admin.post('/admin/equipos/3/estado').type('form')
      .send({ _csrf: csrfAdmin, estado: 'operativo' })
      .expect(303);

    const lista = await request(app).get('/equipos?tipo=sobremesa&operativos=true');
    expect(lista.text).toContain('PC-003');
    expect(lista.text).toContain('PC-002');
  });
});

describe('Reservas', () => {
  it('6. reserva un equipo disponible (PRG con 303)', async () => {
    const respuesta = await ana.post('/reservas').type('form')
      .send({ _csrf: csrfAna, equipoId: '2', fecha: FECHA, turno: 'manana' });
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.location).toBe('/mis-reservas');

    const mias = await ana.get('/mis-reservas');
    expect(mias.text).toContain('Reserva creada correctamente.');
    expect(mias.text).toContain(FECHA);
  });

  it('7. rechaza con 409 una reserva del mismo equipo, fecha y turno', async () => {
    const respuesta = await luis.post('/reservas').type('form')
      .send({ _csrf: csrfLuis, equipoId: '2', fecha: FECHA, turno: 'manana' });
    expect(respuesta.status).toBe(409);
    expect(respuesta.text).toContain('ya está reservado');
  });

  it('8. no deja cancelar la reserva de otro usuario (403)', async () => {
    // La reserva 1 es de Ana: Luis cambia el id en la URL
    const respuesta = await luis.post('/reservas/1/cancelar').type('form')
      .send({ _csrf: csrfLuis });
    expect(respuesta.status).toBe(403);
  });

  it('9. rechaza una petición sin token CSRF válido (403)', async () => {
    const sinToken = await ana.post('/reservas').type('form')
      .send({ equipoId: '1', fecha: OTRA_FECHA, turno: 'tarde' });
    expect(sinToken.status).toBe(403);

    const tokenFalso = await ana.post('/reservas').type('form')
      .send({ _csrf: 'falso', equipoId: '1', fecha: OTRA_FECHA, turno: 'tarde' });
    expect(tokenFalso.status).toBe(403);

    // No se ha creado la reserva
    const mias = await ana.get('/mis-reservas');
    expect(mias.text).not.toContain(OTRA_FECHA);
  });

  it('rechaza datos incorrectos con 400', async () => {
    const respuesta = await ana.post('/reservas').type('form')
      .send({ _csrf: csrfAna, equipoId: 'abc', fecha: FECHA, turno: 'noche' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.text).toContain('Selecciona un equipo válido.');
  });

  it('una reserva cancelada deja el equipo libre para otro usuario', async () => {
    // La reserva del test 6 es la 4 (hay 3 iniciales)
    await ana.post('/reservas/4/cancelar').type('form')
      .send({ _csrf: csrfAna })
      .expect(303);
    await luis.post('/reservas').type('form')
      .send({ _csrf: csrfLuis, equipoId: '2', fecha: FECHA, turno: 'manana' })
      .expect(303);
  });
});

describe('Cierre de sesión', () => {
  it('10. invalida la sesión después del logout', async () => {
    const agente = request.agent(app);
    const csrf = await entrar(agente, 'ana@example.com', 'ana12345');

    const salida = await agente.post('/logout').type('form').send({ _csrf: csrf });
    expect(salida.status).toBe(303);
    expect(salida.headers.location).toBe('/login');

    const perfil = await agente.get('/perfil');
    expect(perfil.status).toBe(303);
    expect(perfil.headers.location).toBe('/login');
  });
});

describe('Catálogo de equipos', () => {
  it('filtra por tipo y responde 400 y 404 cuando corresponde', async () => {
    const portatiles = await request(app).get('/equipos?tipo=portatil');
    expect(portatiles.status).toBe(200);
    expect(portatiles.text).toContain('PORT-001');
    expect(portatiles.text).not.toContain('PC-001');

    await request(app).get('/equipos?tipo=tablet').expect(400);
    await request(app).get('/equipos/999').expect(404);
  });

  it('usa la cookie de preferencias como filtro inicial', async () => {
    const visitante = request.agent(app);
    await visitante.post('/preferencias').type('form').send({ tipo: 'portatil' }).expect(303);
    const lista = await visitante.get('/equipos');
    expect(lista.text).toContain('PORT-001');
    expect(lista.text).not.toContain('PC-001');
  });
});
