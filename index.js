 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require("path");

// Routes
const authRoutes = require('./routes/authRoutes');
const sociosRoutes = require('./routes/authSocios');
const changePassword = require('./routes/changePassword');
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const routesActividades = require('./routes/routesActividades');
const activeRoutes = require('./routes/activeRoutes');
const descargaRoutes = require('./routes/descargaRoutes');
const userActividadRoutes = require('./routes/userActividad');
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

// ─── Connection caching para Vercel serverless ────────────────────────────────
// En serverless, el módulo se puede reutilizar entre invocaciones (warm start).
// Guardamos la promesa en global para no reconectar si ya hay conexión activa.
let connectionPromise = null;

async function connectDB() {
  // Si ya está conectado, no hacemos nada
  if (mongoose.connection.readyState === 1) return;

  // Si ya hay una conexión en progreso, esperamos esa misma
  if (!connectionPromise) {
    connectionPromise = mongoose.connect( "mongodb+srv://empatiadigital2025:Gali282016@empatia1.s1i7isu.mongodb.net/?retryWrites=true&w=majority&appName=Empatia1", {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
  }

  await connectionPromise;
}

// ─── Middleware: conectar DB antes de cualquier request a /api ────────────────
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Error de conexión a MongoDB:', err.message);
    return res.status(503).json({
      error: 'Servicio no disponible — base de datos no conectada, reintentá en unos segundos'
    });
  }
});

// Rutas
app.get('/', (req, res) => res.send('Backend activo'));
app.use('/api', changePassword);
app.use('/api/auth', authRoutes);
app.use('/api', sociosRoutes);
app.use('/api', postRoutes);
app.use('/api', uploadRoutes);
app.use('/api', activeRoutes);
app.use('/api/actividades', routesActividades);
app.use('/api/descarga', descargaRoutes);
app.use('/api', userActividadRoutes);
app.use('/api', postStatsRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/inscriptions', inscriptionRoutes);

// ─── Exportar para Vercel (NO usar app.listen) ────────────────────────────────
module.exports = app;
