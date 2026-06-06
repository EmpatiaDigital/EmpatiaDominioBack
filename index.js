const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const sociosRoutes =  require('./routes/authSocios')
const changePassword =  require('./routes/changePassword')
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const routesActividades = require('./routes/routesActividades');
const activeRoutes = require('./routes/activeRoutes');
const descargaRoutes = require('./routes/descargaRoutes');
const userActividadRoutes = require('./routes/userActividad');
const path = require("path");
const Post = require("./models/Post");
const courseRoutes = require('./routes/courseRoutes');
const inscriptionRoutes = require('./routes/inscriptionRoutes');
const postStatsRoutes = require('./routes/postStatsRoutes');


dotenv.config();
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use("/descargas", express.static(path.join(__dirname, "public/descargas")));

// ─── Middleware: bloquea requests a /api si MongoDB no está listo ─────────
// Esto evita que las queries entren al buffer de Mongoose y hagan timeout.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Servicio no disponible — base de datos no conectada, reintentá en unos segundos'
    });
  }
  next();
});

// Rutas
app.get('/', (req, res) => {
  res.send('Ahora sí estoy Backend');
});
app.use('/api', changePassword);
app.use('/api/auth', authRoutes);
app.use('/api',sociosRoutes);
app.use('/api',postRoutes);
app.use('/api', uploadRoutes);
app.use('/api', activeRoutes);
app.use('/api/actividades', routesActividades);
app.use('/api/descarga', descargaRoutes);
app.use('/api', userActividadRoutes);
app.use('/api', postStatsRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/inscriptions', inscriptionRoutes);

// ─── Conexión a MongoDB con opciones profesionales ────────────────────────
// Se agrega serverSelectionTimeoutMS, socketTimeoutMS y pool de conexiones.
// El servidor solo arranca DESPUÉS de que MongoDB confirme la conexión,
// así nunca hay requests en vuelo mientras la DB todavía está conectando.
mongoose.connect(
  "mongodb+srv://empatiadigital2025:Gali282016@empatia1.s1i7isu.mongodb.net/?retryWrites=true&w=majority&appName=Empatia1",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,              // Hasta 10 conexiones paralelas al pool
    minPoolSize: 2,               // 2 conexiones siempre calientes
    serverSelectionTimeoutMS: 10000, // Tiempo máximo para seleccionar servidor
    socketTimeoutMS: 45000,          // Tiempo máximo por operación
    connectTimeoutMS: 10000,         // Tiempo máximo para conectar
    heartbeatFrequencyMS: 10000,     // Heartbeat cada 10s para detectar caídas
  }
)
  .then(() => {
    console.log('Conectado a MongoDB');

    // ✅ Express solo arranca cuando MongoDB ya está conectado
    app.listen(process.env.PORT, () => {
      console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Error de conexión a MongoDB:', err.message);
    process.exit(1); // Si no hay DB al arrancar, no tiene sentido seguir
  });

// Eventos de reconexión para detectar caídas durante el runtime
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB desconectado — las peticiones a /api devolverán 503');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconectado — el servicio vuelve a estar disponible');
});
mongoose.connection.on('error', (err) => {
  console.error('Error de MongoDB:', err.message);
});
