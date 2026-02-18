const Post = require('../models/Post');
const Socio = require('../models/Socio');
const nodemailer = require('nodemailer');

// Transportador con Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "empatiadigital2025@gmail.com",
    pass: "cpcr sgyc pxrw rgvt",
  },
});

exports.crearPost = async (req, res) => {
  try {
    const {
      titulo, autor, epigrafe, portada, contenido,
      imagenes, epigrafes, fecha, categoria, avatar, PostId
    } = req.body;

    if (!titulo || !autor || !contenido) {
      return res.status(400).json({ error: 'Título, autor y contenido son obligatorios' });
    }

    const nuevoPost = new Post({
      titulo,
      autor,
      epigrafe,
      portada,
      contenido,
      imagenes,
      epigrafes,
      categoria,
      avatar,
      PostId,
      fecha: fecha || Date.now()
    });

    await nuevoPost.save();

    // 🔔 Obtener todos los socios
    const socios = await Socio.find();

    // 🔁 Enviar correo a cada socio
    for (const socio of socios) {
      const mailOptions = {
        from: '"Empatía Digital" <empatiadigital2025@gmail.com>',
        to: socio.correo,
        subject: `Nuevo post: ${titulo}`,
        html: `
        <div style="font-family: 'Arial', sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50; text-align: center;"> Nuevo post en Empatía Digital</h2>
          
          <h3 style="color: #2980b9;">${titulo}</h3>
          <p style="font-size: 14px; color: #555;"><strong>Autor:</strong> ${autor}</p>
          
          ${epigrafe ? `<p style="font-style: italic; color: #777;">${epigrafe}</p>` : ''}
      
          ${portada ? `
            <div style="text-align: center; margin: 20px 0;">
              <img src="${portada}" alt="Portada del post" style="max-width: 100%; width: 100%; height: auto; border-radius: 6px; display: block; margin: 0 auto;" />
            </div>
          ` : ''}
      
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.empatiadigital.com.ar/post/${nuevoPost._id}" 
               style="background-color: #27ae60; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              🔗 Ver el post completo
            </a>
          </div>
      
          <p style="font-size: 12px; color: #aaa; margin-top: 30px; text-align: center;">
            Enviado automáticamente por Empatía Digital.
          </p>
        </div>
      `
      
      };

      // Enviar
      await transporter.sendMail(mailOptions);
    }

    res.status(201).json({ message: 'Post creado con éxito y correos enviados', post: nuevoPost });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el post o al enviar los correos' });
  }
};


exports.obtenerPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ fecha: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
};

exports.obtenerPostPorId = async (req, res) => {
  try {
    const post = await Post.findById(req.params.PostId);
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el post' });
  }
};

exports.actualizarPost = async (req, res) => {
  try {
    const { titulo, autor, epigrafe, portada, contenido, imagenes, epigrafes,categoria,fecha } = req.body;
    const postActualizado = await Post.findByIdAndUpdate(
      req.params.PostId,
      { titulo, autor, epigrafe, portada, contenido, imagenes, epigrafes,categoria, fecha },
      { new: true, runValidators: true }
    );

    if (!postActualizado) return res.status(404).json({ error: 'Post no encontrado' });

    res.json({ message: 'Post actualizado', post: postActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el post' });
  }
};

exports.eliminarPost = async (req, res) => {
  try {
    const postEliminado = await Post.findByIdAndDelete(req.params.PostId);
    if (!postEliminado) return res.status(404).json({ error: 'Post no encontrado' });

    res.json({ message: 'Post eliminado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
};



exports.previewPost = async (req, res) => {
  await connectDB(); // si usás el helper de conexión
  try {
    const post = await Post.findById(req.params.PostId);
    if (!post) return res.status(404).send('<h1>Post no encontrado</h1>');

    const userAgent = req.headers['user-agent'] || '';

    // Detectar crawlers de redes sociales
    const esCrawler = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|ia_archiver|Discordbot/i.test(userAgent);

    const titulo   = (post.titulo    || 'Empatía Digital').replace(/[<>"]/g, '');
    const descripcion = (post.epigrafe || 'Leé este artículo en Empatía Digital').replace(/[<>"]/g, '');
    const imagen   = post.portada    || 'https://www.empatiadigital.com.ar/empatialogo.jpg';
    const frontUrl = `https://www.empatiadigital.com.ar/post/${post._id}`;

    // ── Crawlers: solo meta tags, sin JS ──────────────────────────────────
    if (esCrawler) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo} | Empatía Digital</title>
  <meta name="description" content="${descripcion}"/>
  <meta property="og:type"                content="article"/>
  <meta property="og:site_name"           content="Empatía Digital"/>
  <meta property="og:title"              content="${titulo}"/>
  <meta property="og:description"        content="${descripcion}"/>
  <meta property="og:url"                content="${frontUrl}"/>
  <meta property="og:image"              content="${imagen}"/>
  <meta property="og:image:secure_url"   content="${imagen}"/>
  <meta property="og:image:type"         content="image/jpeg"/>
  <meta property="og:image:width"        content="1200"/>
  <meta property="og:image:height"       content="630"/>
  <meta property="og:image:alt"          content="${titulo}"/>
  <meta name="twitter:card"              content="summary_large_image"/>
  <meta name="twitter:title"             content="${titulo}"/>
  <meta name="twitter:description"       content="${descripcion}"/>
  <meta name="twitter:image"             content="${imagen}"/>
</head>
<body>
  <h1>${titulo}</h1>
  <p>${descripcion}</p>
  <img src="${imagen}" alt="${titulo}" style="max-width:600px"/>
  <br/><a href="${frontUrl}">Ver post completo →</a>
</body>
</html>`);
    }

    // ── Humanos: página con SweetAlert2 y cuenta regresiva ────────────────
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo} | Empatía Digital</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>

  <!-- Open Graph igual, por si alguien comparte este link directamente -->
  <meta property="og:type"              content="article"/>
  <meta property="og:title"            content="${titulo}"/>
  <meta property="og:description"      content="${descripcion}"/>
  <meta property="og:url"              content="${frontUrl}"/>
  <meta property="og:image"            content="${imagen}"/>
  <meta property="og:image:secure_url" content="${imagen}"/>
  <meta property="og:image:type"       content="image/jpeg"/>
  <meta property="og:image:width"      content="1200"/>
  <meta property="og:image:height"     content="630"/>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a3a3a 0%, #194542 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .card img {
      width: 100%;
      height: 260px;
      object-fit: cover;
      display: block;
    }
    .card-body {
      padding: 28px 32px 32px;
    }
    .badge {
      display: inline-block;
      background: #e8f5e9;
      color: #194542;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 14px;
    }
    h1 {
      font-size: 1.5rem;
      color: #1a1a1a;
      line-height: 1.4;
      margin-bottom: 10px;
    }
    p.epigrafe {
      font-size: 0.95rem;
      color: #666;
      font-style: italic;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .progress-bar-wrap {
      background: #e0e0e0;
      border-radius: 8px;
      height: 6px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #42a5f5, #194542);
      border-radius: 8px;
      width: 100%;
      transition: width 1s linear;
    }
    .redirect-msg {
      font-size: 0.85rem;
      color: #999;
      text-align: center;
      margin-bottom: 20px;
    }
    .btn-ir {
      display: block;
      width: 100%;
      padding: 14px;
      background: #194542;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: background 0.2s;
    }
    .btn-ir:hover { background: #0f2b29; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${imagen}" alt="${titulo}" onerror="this.style.display='none'"/>
    <div class="card-body">
      <span class="badge">Empatía Digital</span>
      <h1>${titulo}</h1>
      <p class="epigrafe">${descripcion}</p>

      <div class="progress-bar-wrap">
        <div class="progress-bar" id="bar"></div>
      </div>
      <p class="redirect-msg" id="msg">Redirigiendo en <strong id="countdown">4</strong> segundos…</p>

      <a href="${frontUrl}" class="btn-ir" id="btnIr">
        Ir al post ahora →
      </a>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
  <script>
    const frontUrl = "${frontUrl}";
    let segundos = 4;
    const bar = document.getElementById('bar');
    const countdown = document.getElementById('countdown');

    // Animar barra de progreso
    setTimeout(() => { bar.style.width = '0%'; }, 50);

    const intervalo = setInterval(() => {
      segundos--;
      countdown.textContent = segundos;
      if (segundos <= 0) {
        clearInterval(intervalo);
        Swal.fire({
          icon: 'success',
          title: '¡Redirigiendo!',
          text: 'Te llevamos al post completo…',
          timer: 1200,
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#f0faf9',
          color: '#194542',
          iconColor: '#42a5f5',
        }).then(() => {
          window.location.href = frontUrl;
        });
      }
    }, 1000);

    // Si hace clic antes de la cuenta
    document.getElementById('btnIr').addEventListener('click', (e) => {
      e.preventDefault();
      clearInterval(intervalo);
      window.location.href = frontUrl;
    });
  </script>
</body>
</html>`);

  } catch (error) {
    console.error(error);
    res.status(500).send('<h1>Error al cargar el post</h1>');
  }
};
