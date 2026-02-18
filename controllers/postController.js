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
  try {
    const Post = require('../models/Post'); // ajustá el path si es diferente
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).send('<h1>Post no encontrado</h1>');

    const titulo  = post.titulo  || 'Empatía Digital';
    const epigrafe = post.epigrafe || '';
    const imagen  = post.portada || '';
    const frontUrl = `https://www.empatiadigital.com.ar/post/${post._id}`;

    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo} | Empatía Digital</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta property="og:title"       content="${titulo}"/>
  <meta property="og:description" content="${epigrafe}"/>
  <meta property="og:image"       content="${imagen}"/>
  <meta property="og:url"         content="${frontUrl}"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a3a3a, #194542);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 28px 72px rgba(0,0,0,0.5);
      animation: fadeUp 0.45s ease;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(24px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .portada {
      width: 100%; height: 260px;
      object-fit: cover; display: block;
      background: #194542;
    }
    .body { padding: 28px; }
    .badge {
      background: #e8f5e9; color: #194542;
      font-size: 0.7rem; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
      padding: 4px 12px; border-radius: 20px;
      display: inline-block; margin-bottom: 12px;
    }
    h1 { font-size: 1.4rem; color: #111; margin-bottom: 10px; line-height: 1.35; }
    .epigrafe {
      font-size: 0.92rem; color: #666;
      font-style: italic; line-height: 1.6;
      border-left: 4px solid #42a5f5;
      padding-left: 12px; margin-bottom: 24px;
    }
    .bar-label {
      display: flex; justify-content: space-between;
      font-size: 0.78rem; color: #aaa; margin-bottom: 6px;
    }
    .bar-label strong { color: #194542; font-size: 0.95rem; }
    .bar-wrap {
      background: #e5e5e5; border-radius: 99px;
      height: 8px; overflow: hidden; margin-bottom: 18px;
    }
    .bar-inner {
      height: 100%; width: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #42a5f5, #194542);
    }
    .btn {
      display: block; width: 100%; padding: 14px;
      background: linear-gradient(135deg, #194542, #0f2b29);
      color: #fff; border-radius: 12px;
      font-size: 1rem; font-weight: 700;
      text-align: center; text-decoration: none;
      box-shadow: 0 4px 18px rgba(25,69,66,0.35);
      transition: transform 0.15s;
    }
    .btn:hover { transform: translateY(-2px); }
    .footer {
      color: rgba(255,255,255,0.4);
      font-size: 0.75rem; margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <img class="portada" src="${imagen}" alt="${titulo}"
         onerror="this.style.display='none'"/>
    <div class="body">
      <span class="badge">✦ Empatía Digital</span>
      <h1>${titulo}</h1>
      ${epigrafe ? `<p class="epigrafe">${epigrafe}</p>` : ''}
      <div class="bar-label">
        <span>Redirigiendo…</span>
        <strong id="num">5</strong>
      </div>
      <div class="bar-wrap">
        <div class="bar-inner" id="bar"></div>
      </div>
      <a href="${frontUrl}" class="btn" id="btn">Leer artículo completo →</a>
    </div>
  </div>
  <p class="footer">Serás redirigido a empatiadigital.com.ar</p>

  <script>
    var dest = '${frontUrl}';
    var n = 5;
    var bar = document.getElementById('bar');
    var num = document.getElementById('num');

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        bar.style.transition = 'width 5s linear';
        bar.style.width = '0%';
      });
    });

    var t = setInterval(function(){
      n--;
      num.textContent = n;
      if (n <= 0) { clearInterval(t); window.location.replace(dest); }
    }, 1000);

    document.getElementById('btn').addEventListener('click', function(e){
      e.preventDefault(); clearInterval(t); window.location.replace(dest);
    });
  </script>
</body>
</html>`);

  } catch (error) {
    res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
};

