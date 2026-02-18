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

    const esc = (str = '') => String(str).replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'}[c]));

    const titulo      = esc(post.titulo)   || 'Empatía Digital';
    const descripcion = esc(post.epigrafe) || 'Leé este artículo en Empatía Digital';
    const autor       = esc(post.autor)    || '';
    const categoria   = Array.isArray(post.categoria) ? esc(post.categoria[0]) : esc(post.categoria);
    const fecha       = post.fecha ? new Date(post.fecha).toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' }) : '';
    const frontUrl    = `https://www.empatiadigital.com.ar/post/${post._id}`;
    const frontUrlJS  = frontUrl.replace(/'/g, "\\'");
    const avatar      = post.avatar || 'https://cdn-icons-png.flaticon.com/512/64/64572.png';

    const imagenRaw = post.portada || 'https://www.empatiadigital.com.ar/empatialogo.jpg';
    const imagen = imagenRaw.includes('cloudinary')
      ? imagenRaw.replace('/upload/', '/upload/w_1200,h_630,c_fill,f_jpg,q_auto/')
      : imagenRaw;

    // ── CRAWLERS ──────────────────────────────────────────────────────────
    if (esCrawler) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
  <h1>${titulo}</h1><p>${descripcion}</p>
  <a href="${frontUrl}">Ver post completo →</a>
</body>
</html>`);
    }

    // ── HUMANOS: HTML COMPLETO CON PREVIEW DEL POST ───────────────────────
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo} | Empatía Digital</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta property="og:type"        content="article"/>
  <meta property="og:title"       content="${titulo}"/>
  <meta property="og:description" content="${descripcion}"/>
  <meta property="og:url"         content="${frontUrl}"/>
  <meta property="og:image"       content="${imagen}"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css"/>
  <style>
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #1a3a3a 0%, #194542 100%);
      min-height: 100vh;
      padding: 30px 16px 60px;
    }

    /* ── HEADER TOP ── */
    .top-bar {
      max-width: 780px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .top-bar .logo {
      color: #fff;
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-decoration: none;
    }
    .top-bar .logo span { color: #42a5f5; }

    /* ── CARD PRINCIPAL ── */
    .card {
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      max-width: 780px;
      margin: 0 auto;
      box-shadow: 0 28px 72px rgba(0,0,0,0.5);
      animation: fadeUp 0.45s ease;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(28px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ── PORTADA ── */
    .portada-wrap {
      width: 100%;
      height: 320px;
      background: #194542;
      position: relative;
      overflow: hidden;
    }
    @media(max-width:600px){ .portada-wrap{ height: 210px; } }
    .portada-wrap img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .portada-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65));
    }
    .portada-badge {
      position: absolute;
      top: 16px; left: 16px;
      background: #42a5f5;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 20px;
    }
    .portada-categoria {
      position: absolute;
      top: 16px; right: 16px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.3);
    }

    /* ── CUERPO ── */
    .card-body { padding: 32px 36px 36px; }
    @media(max-width:600px){ .card-body{ padding: 22px 20px 28px; } }

    .post-titulo {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111;
      line-height: 1.3;
      margin-bottom: 14px;
    }
    @media(max-width:600px){ .post-titulo{ font-size: 1.3rem; } }

    .post-epigrafe {
      font-size: 1rem;
      color: #555;
      font-style: italic;
      line-height: 1.6;
      border-left: 4px solid #42a5f5;
      padding-left: 14px;
      margin-bottom: 22px;
    }

    /* ── META AUTOR ── */
    .post-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #f4f9f8;
      border-radius: 12px;
      margin-bottom: 28px;
    }
    .post-meta img {
      width: 46px; height: 46px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #194542;
      flex-shrink: 0;
    }
    .post-meta-text { line-height: 1.4; }
    .post-meta-text strong { color: #194542; font-size: 0.95rem; }
    .post-meta-text span   { color: #888;    font-size: 0.8rem; display: block; }

    /* ── CONTENIDO PREVIEW ── */
    .post-contenido-preview {
      font-size: 0.97rem;
      color: #333;
      line-height: 1.75;
      margin-bottom: 30px;
      max-height: 180px;
      overflow: hidden;
      position: relative;
    }
    .post-contenido-preview::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 80px;
      background: linear-gradient(transparent, #fff);
    }
    /* estilos para HTML interno del contenido */
    .post-contenido-preview h1,
    .post-contenido-preview h2,
    .post-contenido-preview h3 { font-size: 1rem; font-weight: 700; margin-bottom: 6px; }
    .post-contenido-preview p  { margin-bottom: 10px; }
    .post-contenido-preview img{ display:none; } /* ocultar imágenes internas en preview */

    /* ── BARRA COUNTDOWN ── */
    .divider { height: 1px; background: #eee; margin-bottom: 24px; }

    .bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: #aaa;
      margin-bottom: 6px;
    }
    .bar-label strong { color: #194542; font-size: 0.95rem; }
    .bar-wrap {
      background: #e5e5e5;
      border-radius: 99px;
      height: 8px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .bar-inner {
      height: 100%;
      width: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #42a5f5, #194542);
      transition: none;
    }

    .btn-ir {
      display: block;
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #194542, #0f2b29);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 18px rgba(25,69,66,0.35);
    }
    .btn-ir:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(25,69,66,0.45); }
    .btn-ir:active { transform: translateY(0); }

    .footer-note {
      text-align: center;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.45);
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <div class="top-bar">
    <a class="logo" href="https://www.empatiadigital.com.ar">Empatía<span>Digital</span></a>
  </div>

  <div class="card">

    <!-- PORTADA -->
    <div class="portada-wrap">
      <img src="${imagen}" alt="${titulo}"
           onerror="this.parentElement.style.background='#194542'; this.remove();"/>
      <div class="portada-overlay"></div>
      <span class="portada-badge">✦ Empatía Digital</span>
      ${categoria ? `<span class="portada-categoria">${categoria}</span>` : ''}
    </div>

    <div class="card-body">

      <!-- TÍTULO -->
      <h1 class="post-titulo">${titulo}</h1>

      <!-- EPÍGRAFE -->
      ${descripcion ? `<p class="post-epigrafe">${descripcion}</p>` : ''}

      <!-- META AUTOR -->
      <div class="post-meta">
        <img src="${avatar}" alt="${autor}"
             onerror="this.src='https://cdn-icons-png.flaticon.com/512/64/64572.png'"/>
        <div class="post-meta-text">
          <strong>${autor}</strong>
          <span>${fecha}${categoria ? ' · ' + categoria : ''}</span>
        </div>
      </div>

      <!-- PREVIEW DEL CONTENIDO -->
      <div class="post-contenido-preview">
        ${post.contenido || ''}
      </div>

      <div class="divider"></div>

      <!-- COUNTDOWN -->
      <div class="bar-label">
        <span>Redirigiendo al artículo completo…</span>
        <strong id="num">5</strong>
      </div>
      <div class="bar-wrap">
        <div class="bar-inner" id="bar"></div>
      </div>

      <a href="${frontUrlJS}" class="btn-ir" id="btnIr">
        Leer el artículo completo →
      </a>

    </div>
  </div>

  <p class="footer-note">Serás redirigido automáticamente a empatiadigital.com.ar</p>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
  <script>
    var DEST = '${frontUrlJS}';
    function irAlFront() { window.location.replace(DEST); }

    var TOTAL = 5, restantes = TOTAL;
    var bar = document.getElementById('bar');
    var num = document.getElementById('num');

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        bar.style.transition = 'width ' + TOTAL + 's linear';
        bar.style.width = '0%';
      });
    });

    var tick = setInterval(function(){
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
          didClose: function(){ irAlFront(); }
        });
      }
    }, 1000);

    document.getElementById('btnIr').addEventListener('click', function(e){
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
