
const express = require("express");
const Descarga = require("../models/Descarga");
const nodemailer = require("nodemailer");
const router = express.Router();


// Transportador básico con Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "empatiadigital2025@gmail.com",
    pass: "bxtq qnew iguv hegu", // ⚠️ Asegurate de que sea una App Password
  },
});

// POST /api/descarga – Subir desde base64 y enviar correo
router.post("/", async (req, res) => {
  const { title, type, filename, portada, fileData, email } = req.body;

  if (!fileData || !filename) {
    return res.status(400).json({ error: "Faltan datos del archivo." });
  }

  try {
    const nuevo = new Descarga({
      type,
      title,
      filename,
      portada,
      fileData,
    });

    await nuevo.save();

    // Enviar correo si se proporcionó email
    if (email) {
      const enlaceDescarga = `https://tusitio.com/descargas`; // Ajustá a tu dominio

      await transporter.sendMail({
        from: '"Empatía Digital" <empatiadigital2025@gmail.com>',
        to: email,
        subject: `¡Nuevo recurso disponible para descargar! 📥`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #4CAF50;">Nuevo archivo disponible: <strong>${title}</strong></h2>
            <p>Hola 👋,</p>
            <p>Te informamos que se ha subido un nuevo recurso (${type}) que podés descargar desde nuestra plataforma.</p>
            <img src="${portada}" alt="Portada" style="max-width: 100%; border-radius: 10px; margin: 10px 0;" />
            <p>
              <a href="${enlaceDescarga}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Ver y descargar</a>
            </p>
            <p>Gracias por confiar en <strong>Empatía Digital</strong> 💚</p>
          </div>
        `,
      });
    }

    res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error al guardar o enviar correo:", err);
    res.status(500).json({ error: err.message });
  }
});




// GET /api/descarga – Listar
router.get("/", async (req, res) => {
  try {
    const items = await Descarga.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// DELETE /api/descarga/:id – Eliminar por ID
router.delete("/:id", async (req, res) => {
  try {
    const eliminado = await Descarga.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrado." });
    res.json({ message: "Eliminado correctamente.", item: eliminado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
