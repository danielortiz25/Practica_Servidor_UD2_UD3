// SERVER.JS — Arranca el servidor (las pruebas no usan este archivo)
import { config } from './config.js';
import { app } from './app.js';

app.listen(config.puerto, () => {
  console.log(`Servidor en http://localhost:${config.puerto}`);
});
