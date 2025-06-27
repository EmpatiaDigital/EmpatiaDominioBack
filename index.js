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
mongoose.connect("mongodb+srv://empatiadigital2025:empatiadigital2025@empatia1.s1i7isu.mongodb.net/?retryWrites=true&w=majority&appName=Empatia1", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión', err));


app.get("/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("No encontrado papu este seria el de prueba el backend");

    const userAgent = req.headers['user-agent'] || "";
    const isBot = /facebook|twitter|whatsapp|discord|slack|telegram/i.test(userAgent.toLowerCase());

    if (isBot) {
      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>${post.titulo}</title>
          <meta name="description" content="${post.epigrafe || ''}" />
          <meta property="og:title" content="${post.titulo}" />
          <meta property="og:description" content="${post.epigrafe || ''}" />
          <meta property="og:image" content="${post.portada}" />
          <meta property="og:url" content="https://empatiadigital.com.ar/post/${post._id}" />
          <meta property="og:type" content="article" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${post.titulo}" />
          <meta name="twitter:description" content="${post.epigrafe || ''}" />
          <meta name="twitter:image" content="${post.portada}" />
        </head>
        <body>
          <h1>Redirigiendo...</h1>
        </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } else {
      // Para usuarios normales redirigimos a SPA React
      return res.redirect(`https://empatia-front.vercel.app/app/post/${post._id}`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error del servidor");
  }
});
// Puerto
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});
