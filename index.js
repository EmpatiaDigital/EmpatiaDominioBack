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


// Usamos las rutas
dotenv.config();
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/descargas", express.static(path.join(__dirname, "public/descargas")));
// Rutas
app.get('/api', (req, res) => {
  res.send('Ahora sí estoy');
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


// Conexión a la base de datos
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión', err));

// Puerto
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});
