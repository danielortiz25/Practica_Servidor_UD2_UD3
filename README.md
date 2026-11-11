# Práctica UD2 y UD3 – Sistema de reserva de equipos informáticos (DWES)

Chat con Claude : https://claude.ai/share/af71aabc-d83b-4a71-aa18-ac3369a9ef10

Aplicación web con **Node.js, Express y EJS** para reservar los equipos informáticos de un centro educativo por fecha y turno. Incluye registro e inicio de sesión, gestión de reservas, zona de administración, protección CSRF, límite de intentos de login, una parte en **TypeScript** y pruebas con **Vitest + Supertest**.

Autor: Daniel Ortiz Jiménez

---

## 1. Requisitos

- Node.js 24 (mínimo 20.6, para la opción `--env-file`)
- npm

## 2. Instalación y configuración

```bash
git clone https://github.com/danielortiz25/Practica_Servidor_UD2_UD3.git
cd Practica_Servidor_UD2_UD3
npm install

# Crear el archivo de configuración a partir de la plantilla
cp .env.example .env        # en PowerShell: copy .env.example .env

# Generar un secreto y pegarlo en SESSION_SECRET dentro de .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Variables de entorno (`.env`):

| Variable | Valores | Descripción |
|---|---|---|
| `PORT` | 1–65535 | Puerto del servidor (por defecto 3000) |
| `NODE_ENV` | `development`, `test`, `production` | Entorno de ejecución |
| `SESSION_SECRET` | mínimo 32 caracteres | Secreto que firma la cookie de sesión |

`src/config.js` valida estos valores al arrancar. Si alguno es incorrecto, el servidor **no arranca** y muestra qué clave falla, sin imprimir nunca el secreto. El archivo `.env` está excluido del repositorio en `.gitignore`.

## 3. Ejecución

```bash
npm start        # node --env-file=.env src/server.js
npm run dev      # igual, pero se reinicia al guardar cambios
```

Abre <http://localhost:3000>.

### Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| admin | admin@example.com | admin1234 |
| usuario | ana@example.com | ana12345 |
| usuario | luis@example.com | luis12345 |

Los datos están en memoria (`src/repositories/datos.js`): 3 equipos, 3 reservas y 3 usuarios. Las contraseñas se guardan como hash de **bcrypt** que se genera al arrancar. Al reiniciar el servidor, los datos vuelven a su estado inicial.

## 4. Estructura del proyecto (arquitectura por capas)

El proyecto tiene las capas que pide el enunciado (apartado 4): rutas, controladores, servicios, repositorios y vistas.

```
src/
├── config.js                    Configuración validada (PORT, NODE_ENV, SESSION_SECRET)
├── app.js                       Crea la app: sesión, composición, rutas y errores (sin listen)
├── server.js                    Arranca el servidor (app.listen)
├── routes/                      RUTAS: método + URL + middleware
│   ├── equipos.js  auth.js  reservas.js  admin.js
│   └── middleware.js            Autenticación, roles, CSRF, límite de login, avisos y errores
├── controllers/                 CONTROLADORES: leen req, validan, convierten y responden
│   ├── equipos.js  auth.js  reservas.js  admin.js
│   └── validaciones.js          enteroPositivo y validación de registro, login y equipos
├── services/                    SERVICIOS: reglas de negocio (sin req, res ni EJS)
│   ├── equipos.js  reservas.js  usuarios.js
│   ├── funcionesReservas.js     estaReservado, obtenerEquiposDisponibles, validarReserva
│   └── errores.js               ErrorDominio
└── repositories/                REPOSITORIOS: acceso a las colecciones en memoria (Map)
    ├── equipos.js  reservas.js  usuarios.js
    └── datos.js                 Datos iniciales
views/                           VISTAS EJS (parciales/, equipos/, auth/, reservas/, admin/)
public/estilos.css               Estilos
src-ts/                          Núcleo de reservas en TypeScript
tests/                           Pruebas con Vitest y Supertest
```

| Capa | Responsabilidad | No conoce |
|---|---|---|
| Rutas | URL, método y orden de middleware | Reglas de negocio |
| Controladores | Leer `req`, validar y convertir datos, elegir la respuesta (200/303/400…) | Cómo se guardan los datos |
| Servicios | Disponibilidad, conflictos, propiedad y cancelaciones | `req`, `res`, EJS |
| Repositorios | Guardar y buscar registros en un `Map` | HTTP y vistas |
| Vistas | Mostrar datos ya preparados, con salida escapada `<%= %>` | Sesión completa, repositorios |

En `src/app.js` se crean los repositorios, después los servicios (que reciben los repositorios) y después los controladores (que reciben los servicios). Por último se montan las rutas, como en la sesión 10.

## 5. Cómo se ha implementado cada funcionalidad

### 5.1 Consulta de equipos
- `GET /equipos` con los filtros `tipo` (`todos`, `portatil`, `sobremesa`) y `operativos=true`. Un filtro no válido devuelve **400**.
- `GET /equipos/:id` muestra la ficha EJS con el estado del equipo y los turnos ya reservados. Si el id no es válido devuelve **400**; si el equipo no existe, **404**.
- El filtrado se hace en `servicioEquipos.listar` (`src/services/equipos.js`) con `filter`.

### 5.2 Cookie de preferencias
- `POST /preferencias` guarda el tipo preferido (`portatil` o `sobremesa`) en la cookie `tipoPreferido` durante 30 días, con `httpOnly`, `sameSite` y `secure` en producción. Con `ninguno`, la cookie se borra.
- Si `GET /equipos` llega sin `tipo`, el filtro inicial es el valor de la cookie, leído con `cookie-parser`. Antes de usarlo se comprueba que sea un tipo válido.
- La cookie nunca se usa para tomar decisiones de autorización.

### 5.3 Registro y autenticación
- `GET/POST /registro`:
  - Se copian solo `nombre`, `email` y `password`, y se valida el formato.
  - Si el correo está duplicado, devuelve **400**.
  - La contraseña se guarda con `bcrypt.hash`.
  - El rol lo fija el servicio y siempre es `usuario`, aunque se envíe otro.
- `GET/POST /login`:
  - La contraseña se comprueba con `bcrypt.compare`.
  - Si las credenciales son incorrectas, responde **401** con el mismo mensaje tanto si el correo existe como si no.
  - Cuando el login es correcto, se ejecuta `req.session.regenerate`, se guarda solo `usuarioId` y se responde **303** a `/perfil`.
- `POST /logout` ejecuta `req.session.destroy` y `res.clearCookie('reservas.sid')`, y responde **303** a `/login`. Necesita token CSRF.
- `GET /perfil` es una página protegida.
- El usuario actual se carga en cada petición desde el repositorio (`cargarUsuarioActual`, en `src/routes/middleware.js`) a partir de `req.session.usuarioId`. El rol nunca se lee de una cookie del cliente.

### 5.4 Creación de reservas
- `GET /reservas/nueva?fecha=AAAA-MM-DD&turno=manana`:
  - Primero se elige fecha y turno con un formulario GET.
  - Después el `select` muestra **solo los equipos disponibles**, calculados con `obtenerEquiposDisponibles`.
  - Los datos de la página se preparan con un modelo de vista (`crearFormularioVM`, en `src/controllers/reservas.js`).
- `POST /reservas`:
  - El usuario se obtiene de la sesión, nunca del formulario.
  - El controlador valida y convierte los datos con `validarReserva`. Si hay error, devuelve **400** y vuelve a mostrar el formulario con los valores correctos.
  - El servicio repite todas las comprobaciones:
    - el equipo existe (**404**);
    - el equipo está operativo (**409**);
    - la fecha es válida y no es anterior a hoy (**400**);
    - el turno es válido (**400**);
    - no hay otra reserva activa para el mismo equipo, fecha y turno (**409**).
  - Si todo es correcto, se aplica el patrón **PRG**: el aviso se guarda en la sesión y se responde **303** a `/mis-reservas`, donde el mensaje se muestra una sola vez.

### 5.5 Consulta y cancelación
- `GET /mis-reservas` muestra las reservas activas y canceladas del usuario.
- `POST /reservas/:id/cancelar`:
  - El servicio comprueba que la reserva es del usuario (si no, **403**, aunque se cambie el id en la URL), que está activa y que su fecha no ha pasado (si no, **409**).
  - La reserva **no se borra**: solo pasa a `estado: 'cancelada'`.
  - Una reserva cancelada no bloquea el turno, porque `estaReservado` solo tiene en cuenta las activas.

### 5.6 Administración (rol `admin`)
- Rutas:
  - `GET /admin/equipos`
  - `POST /admin/equipos` (alta; un código duplicado da **409**)
  - `POST /admin/equipos/:id/estado` (operativo ↔ fuera de servicio)
  - `GET /admin/reservas`
  - `POST /admin/reservas/:id/cancelar`
- Todas pasan por `exigirRol('admin')`. Un visitante anónimo recibe **303** al login y un usuario normal recibe **403**, aunque haga la petición HTTP directamente.

### 5.7 Seguridad

| Medida | Dónde |
|---|---|
| Middleware de autenticación (`exigirAutenticacion`) | `src/routes/middleware.js` |
| Middleware de roles (`exigirRol`) | `src/routes/middleware.js` |
| Propiedad de las reservas | `cancelarPropia` en `src/services/reservas.js` |
| CSRF: token en sesión + campo oculto `_csrf` en todos los POST autenticados (logout incluido) | `prepararCsrf` y `comprobarCsrf` en `src/routes/middleware.js` |
| Límite de intentos de login (10 cada 15 min) con `express-rate-limit` | `limitarLogin` en `src/routes/middleware.js` |
| Validación de datos | `src/controllers/validaciones.js` y `src/services/funcionesReservas.js` |
| Tratamiento centralizado de errores (sin trazas ni datos internos) | `tratarError` en `src/routes/middleware.js` |
| Cookie de sesión `httpOnly`, `secure` (producción), `sameSite: 'lax'`, `maxAge` 30 min | `src/app.js` |
| Salida escapada con `<%= %>` en todas las vistas | `views/` |

Códigos de respuesta: operación válida **200/303**, datos incorrectos **400**, credenciales incorrectas **401**, sin permiso **403**, no existe **404**, equipo ya reservado **409**.

### 5.8 Funciones de JavaScript obligatorias
Están en `src/services/funcionesReservas.js`, fuera de los controladores y sin depender de `req` ni `res`:
- `estaReservado(equipoId, fecha, turno, reservas)` usa `some`.
- `obtenerEquiposDisponibles(equipos, reservas, fecha, turno)` usa `filter`.
- `validarReserva(datos)` valida los datos y convierte el texto a número.

Además se usan `find` en los repositorios y servicios, y `map` en los repositorios, el modelo de vista y los servicios. Las operaciones de los repositorios y servicios son asíncronas (`async`/`await`).

## 6. Ejemplos con curl

> En Windows usa **Git Bash**, o `curl.exe` en PowerShell. `-c` guarda las cookies en un archivo y `-b` las envía; con los dos a la vez se mantiene la sesión.

```bash
URL=http://localhost:3000
```

### Catálogo (público)
```bash
curl -i "$URL/equipos"
curl -i "$URL/equipos?tipo=portatil"
curl -i "$URL/equipos?tipo=sobremesa"
curl -i "$URL/equipos?operativos=true"
curl -i "$URL/equipos?tipo=portatil&operativos=true"
curl -i "$URL/equipos/1"
curl -i "$URL/equipos/999"            # 404
curl -i "$URL/equipos?tipo=tablet"    # 400
```

### Cookie de preferencias
```bash
curl -i -c prefs.txt -d "tipo=portatil" "$URL/preferencias"   # 303 + Set-Cookie tipoPreferido
curl -b prefs.txt "$URL/equipos"                               # catálogo filtrado por portátiles
```

### Registro
```bash
curl -i "$URL/registro"
curl -i --data-urlencode "nombre=Marta López" -d "email=marta@example.com" -d "password=marta1234" "$URL/registro"   # 303 a /login
curl -i -d "nombre=Marta" -d "email=marta@example.com" -d "password=marta1234" "$URL/registro"                       # 400 (correo duplicado)
```

### Login, perfil y token CSRF
```bash
# Login correcto: 303 a /perfil y cookie de sesión guardada en ana.txt
curl -i -c ana.txt -b ana.txt -d "email=ana@example.com" -d "password=ana12345" "$URL/login"

# Login incorrecto: 401
curl -i -d "email=ana@example.com" -d "password=mal" "$URL/login"

# Perfil con sesión (200) y sin sesión (303 a /login)
curl -i -b ana.txt "$URL/perfil"
curl -i "$URL/perfil"

# Obtener el token CSRF de la sesión (aparece en el campo oculto _csrf de cualquier página)
CSRF=$(curl -s -b ana.txt -c ana.txt "$URL/perfil" | grep -o 'name="_csrf" value="[^"]*"' | head -1 | cut -d'"' -f4)
echo $CSRF
```

### Reservas
```bash
# Equipos disponibles para una fecha y turno
curl -i -b ana.txt "$URL/reservas/nueva?fecha=2027-03-10&turno=manana"

# Crear una reserva (303 a /mis-reservas)
curl -i -b ana.txt -c ana.txt -d "_csrf=$CSRF" -d "equipoId=2" -d "fecha=2027-03-10" -d "turno=manana" "$URL/reservas"

# Ver mis reservas (aparece el aviso de confirmación una sola vez)
curl -i -b ana.txt "$URL/mis-reservas"

# Sin token CSRF: 403
curl -i -b ana.txt -d "equipoId=1" -d "fecha=2027-03-10" -d "turno=manana" "$URL/reservas"

# Datos incorrectos: 400
curl -i -b ana.txt -d "_csrf=$CSRF" -d "equipoId=abc" -d "fecha=2020-01-01" -d "turno=noche" "$URL/reservas"
```

### Reserva duplicada (409) y cancelación ajena (403) con otro usuario
```bash
curl -s -c luis.txt -b luis.txt -d "email=luis@example.com" -d "password=luis12345" "$URL/login" > /dev/null
CSRF_LUIS=$(curl -s -b luis.txt "$URL/perfil" | grep -o 'name="_csrf" value="[^"]*"' | head -1 | cut -d'"' -f4)

# Mismo equipo, fecha y turno que la reserva de Ana: 409
curl -i -b luis.txt -d "_csrf=$CSRF_LUIS" -d "equipoId=2" -d "fecha=2027-03-10" -d "turno=manana" "$URL/reservas"

# Luis intenta cancelar la reserva 1, que es de Ana: 403
curl -i -b luis.txt -d "_csrf=$CSRF_LUIS" "$URL/reservas/1/cancelar"
```

### Cancelar una reserva propia
```bash
# La reserva creada antes es la 4 (hay 3 iniciales)
curl -i -b ana.txt -c ana.txt -d "_csrf=$CSRF" "$URL/reservas/4/cancelar"   # 303 a /mis-reservas
```

### Administración
```bash
curl -s -c admin.txt -b admin.txt -d "email=admin@example.com" -d "password=admin1234" "$URL/login" > /dev/null
CSRF_ADMIN=$(curl -s -b admin.txt "$URL/perfil" | grep -o 'name="_csrf" value="[^"]*"' | head -1 | cut -d'"' -f4)

curl -i -b admin.txt "$URL/admin/equipos"
curl -i -b admin.txt -c admin.txt -d "_csrf=$CSRF_ADMIN" -d "codigo=PC-003" --data-urlencode "nombre=Ordenador aula 3" -d "tipo=sobremesa" "$URL/admin/equipos"
curl -i -b admin.txt -c admin.txt -d "_csrf=$CSRF_ADMIN" -d "estado=operativo" "$URL/admin/equipos/3/estado"
curl -i -b admin.txt "$URL/admin/reservas"
curl -i -b admin.txt -c admin.txt -d "_csrf=$CSRF_ADMIN" "$URL/admin/reservas/2/cancelar"

# Un usuario normal no puede: 403
curl -i -b ana.txt -d "_csrf=$CSRF" -d "codigo=PC-999" -d "nombre=Intruso" -d "tipo=sobremesa" "$URL/admin/equipos"
```

### Cerrar sesión
```bash
curl -i -b ana.txt -c ana.txt -d "_csrf=$CSRF" "$URL/logout"   # 303 a /login
curl -i -b ana.txt "$URL/perfil"                               # 303 a /login: la sesión ya no existe
```

Todas estas operaciones también se pueden hacer desde la interfaz HTML.

## 7. Parte TypeScript

En `src-ts/` está la versión tipada del núcleo de reservas, siguiendo la sesión 11:

| Archivo | Contenido |
|---|---|
| `modelos.ts` | Interfaces `Equipo`, `Reserva` y `Usuario`; tipos unión `Rol`, `Turno`, `EstadoReserva`, `EstadoEquipo` y `TipoEquipo` |
| `RepositorioReservas.ts` | Interfaz del repositorio |
| `RepositorioReservasMemoria.ts` | Clase que implementa la interfaz con un `Map` |
| `ServicioReservas.ts` | Servicio que recibe el repositorio por **inyección de dependencias** en el constructor |
| `ErrorDominio.ts` | Error de dominio con un tipo unión para los códigos |
| `demo.ts` | Demostración de uso |

Se compila con `strict: true` y sin usar `any`:

```bash
npx tsc --noEmit     # solo comprueba los tipos
npx tsc              # compila a dist/ (también: npm run build:ts)
node dist/demo.js    # ejecuta la demostración
```

## 8. Pruebas automatizadas

```bash
npm test
```

Se usan **Vitest** y **Supertest**, como en la sesión 9. Las pruebas importan `app` desde `src/app.js`, así que no hace falta arrancar el servidor. Usan los usuarios de prueba, no cuentas reales. Para mantener la sesión entre peticiones se usa `request.agent`. Al ejecutarlas, Vitest pone `NODE_ENV=test` y `config.js` usa un secreto de prueba, porque no se carga el `.env`.

| # | Prueba | Respuesta esperada |
|---|---|---|
| 1 | Registro de un usuario válido | 303 a /login y login posterior correcto |
| 2 | Credenciales incorrectas | 401 con el mismo mensaje |
| 3 | Ruta privada sin autenticación | 303 a /login |
| 4 | Ruta privada con sesión | 200 |
| 5 | Operación de admin hecha por un usuario | 403 |
| 6 | Reserva válida | 303 a /mis-reservas |
| 7 | Reserva duplicada | 409 |
| 8 | Cancelar una reserva ajena | 403 |
| 9 | Cambio de estado sin token CSRF válido | 403 |
| 10 | Sesión después del logout | 303 a /login |

Además hay pruebas del rol en el registro público, de las reservas canceladas, de los datos inválidos (400), de la administración, de los filtros, de la cookie de preferencias y de las funciones de reserva sin HTTP (`tests/funcionesReservas.test.js`).
