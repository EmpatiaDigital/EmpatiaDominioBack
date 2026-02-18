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
  await connectDB();
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('<h1>Post no encontrado</h1>');

    const userAgent = req.headers['user-agent'] || '';
    const esCrawler = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|ia_archiver|Discordbot/i.test(userAgent);

    const titulo      = (post.titulo   || 'Empatía Digital').replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'}[c]));
    const descripcion = (post.epigrafe || 'Leé este artículo en Empatía Digital').replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'}[c]));
    const frontUrl    = `https://www.empatiadigital.com.ar/post/${post._id}`;

    // ✅ FIX: Cloudinary → forzar dimensiones 1200x630 para que WhatsApp muestre la imagen
    const imagenRaw = post.portada || 'https://www.empatiadigital.com.ar/empatialogo.jpg';
    const imagen = imagenRaw.includes('cloudinary')
      ? imagenRaw.replace('/upload/', '/upload/w_1200,h_630,c_fill,f_jpg,q_auto/')
      : imagenRaw;

    // ── CRAWLERS (WhatsApp, Facebook, etc.) ──────────────────────────────
    if (esCrawler) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // ✅ FIX: Cache-Control para que WhatsApp no cachee la preview vieja
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo} | Empatía Digital</title>
  <meta name="description" content="${descripcion}"/>
  <meta property="og:type"             content="article"/>
  <meta property="og:site_name"        content="Empatía Digital"/>
  <meta property="og:title"            content="${titulo}"/>
  <meta property="og:description"      content="${descripcion}"/>
  <meta property="og:url"              content="${frontUrl}"/>
  <meta property="og:image"            content="${imagenRaw}"/>
  <meta property="og:image:secure_url" content="${imagenRaw}"/>
  <meta property="og:image:type"       content="image/jpeg"/>
  <meta property="og:image:width"      content="1200"/>
  <meta property="og:image:height"     content="630"/>
  <meta property="og:image:alt"        content="${titulo}"/>
  <meta name="twitter:card"            content="summary_large_image"/>
  <meta name="twitter:title"           content="${titulo}"/>
  <meta name="twitter:description"     content="${descripcion}"/>
  <meta name="twitter:image"           content="${imagenRaw}"/>
</head>
<body>
  <h1>${titulo}</h1>
  <p>${descripcion}</p>
  <img src="${imagen}" alt="${titulo}" style="max-width:600px"/>
  <a href="${frontUrl}">Ver post completo →</a>
</body>
</html>`);
    }

    // ── HUMANOS ───────────────────────────────────────────────────────────
    const frontUrlJS = frontUrl.replace(/'/g, "\\'");
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    return res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo} | Empatía Digital</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta property="og:type"             content="article"/>
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
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #1a3a3a 0%, #194542 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 18px;
      overflow: hidden;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 24px 64px rgba(0,0,0,0.45);
      animation: fadeUp 0.5s ease;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(24px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .img-wrap {
      width: 100%;
      height: 240px;
      background: #194542;
      position: relative;
      overflow: hidden;
    }
    .img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .img-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 80px;
      background: linear-gradient(transparent, rgba(0,0,0,0.55));
    }
    .card-body { padding: 26px 28px 30px; }
    .badge {
      display: inline-block;
      background: #e8f5e9;
      color: #194542;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    h1 { font-size: 1.4rem; color: #111; line-height: 1.4; margin-bottom: 8px; }
    .epigrafe {
      font-size: 0.92rem;
      color: #666;
      font-style: italic;
      line-height: 1.55;
      margin-bottom: 22px;
    }
    .bar-wrap {
      background: #e5e5e5;
      border-radius: 99px;
      height: 7px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .bar-inner {
      height: 100%;
      width: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #42a5f5, #194542);
    }
    .countdown-msg {
      font-size: 0.82rem;
      color: #aaa;
      text-align: center;
      margin-bottom: 18px;
    }
    .countdown-msg strong { color: #194542; font-size: 1rem; }
    .btn-ir {
      display: block;
      width: 100%;
      padding: 13px;
      background: #194542;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 0.97rem;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
    }
    .btn-ir:hover  { background: #0f2b29; transform: translateY(-1px); }
    .btn-ir:active { transform: translateY(0); }
  </style>
</head>
<body>
  <div class="card">
    <div class="img-wrap">
      <img
        src="${imagen}"
        alt="${titulo}"
        onerror="this.parentElement.style.background='#194542'; this.remove();"
      />
      <div class="img-overlay"></div>
    </div>
    <div class="card-body">
      <span class="badge">✦ Empatía Digital</span>
      <h1>${titulo}</h1>
      <p class="epigrafe">${descripcion}</p>
      <div class="bar-wrap">
        <div class="bar-inner" id="bar"></div>
      </div>
      <p class="countdown-msg">
        Redirigiendo en <strong id="num">5</strong> segundos…
      </p>
      <a href="${frontUrlJS}" class="btn-ir" id="btnIr">
        Ir al post completo →
      </a>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
  <script>
    var DEST = '${frontUrlJS}';

    function irAlFront() {
      window.location.replace(DEST);
    }

    var TOTAL = 5;
    var restantes = TOTAL;
    var bar = document.getElementById('bar');
    var num = document.getElementById('num');

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        bar.style.transition = 'width ' + TOTAL + 's linear';
        bar.style.width = '0%';
      });
    });

    var tick = setInterval(function() {
      restantes--;
      num.textContent = restantes;
      if (restantes <= 0) {
        clearInterval(tick);
        Swal.fire({
          icon: 'success',
          title: '¡Todo listo!',
          html: 'Abriendo el post en <b>Empatía Digital</b>…',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: true,
          confirmButtonText: 'Ir ahora',
          confirmButtonColor: '#194542',
          background: '#f0faf9',
          color: '#194542',
          iconColor: '#27ae60',
          didClose: function() { irAlFront(); }
        });
      }
    }, 1000);

    document.getElementById('btnIr').addEventListener('click', function(e) {
      e.preventDefault();
      clearInterval(tick);
      irAlFront();
    });
  </script>
</body>
</html>`);

  } catch (error) {
    console.error('previewPost error:', error);
    res.status(500).send('<h1>Error al cargar el post</h1>');
  }
};


