const mongoose = require('mongoose');
const Socio = require('../models/Socio');
const SocioPorCiudad = require('../models/SocioPorCiudad');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Transportador básico con Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "empatiadigital2025@gmail.com",
    pass: "cpcr sgyc pxrw rgvt",
  },
});

exports.registrarSocio = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      correo,
      telefono,
      ciudad,
    } = req.body;

    // provincia no viene del frontend, se fuerza a default
    const provincia = req.body.provincia || "no registrado";

    // ── Validación: solo por correo ──────────────────────────────────────────
    const existePorCorreo = await Socio.findOne({ correo });
    if (existePorCorreo) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un socio registrado con ese correo electrónico.",
      });
    }

    // ── Validación: teléfono solo si viene y no está vacío ───────────────────
    if (telefono && telefono.trim() !== "") {
      const existePorTelefono = await Socio.findOne({ telefono: telefono.trim() });
      if (existePorTelefono) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un socio registrado con ese número de teléfono.",
        });
      }
    }

    const idUnico = new mongoose.Types.ObjectId();

    // Obtener número de socio secuencial
    const ultimoSocio = await Socio.findOne().sort({ numeroSocio: -1 });
    const nuevoNumero = ultimoSocio ? ultimoSocio.numeroSocio + 1 : 1;

    const cuotaAnual = 12;

    // ── Crear socio ──────────────────────────────────────────────────────────
    const nuevoSocio = new Socio({
      _id: idUnico,
      nombre,
      apellido,
      correo,
      telefono: telefono?.trim() || "",
      provincia,
      ciudad,
      numeroSocio: nuevoNumero,
      cuota: cuotaAnual,
    });
    await nuevoSocio.save();

    // ── Registrar socio por ciudad ───────────────────────────────────────────
    if (ciudad) {
      const socioCiudad = new SocioPorCiudad({
        _id: idUnico,
        ciudad,
        correo,
        provincia,
        socioId: idUnico,
      });
      await socioCiudad.save();
    }

    // ── Generar usuario y contraseña ─────────────────────────────────────────
    const password = crypto.randomBytes(6).toString('hex');
    const username = correo.toLowerCase();

    const nuevoUsuario = new User({
      _id: idUnico,
      username,
      password,
      role: 'socio',
    });
    await nuevoUsuario.save();

    // ── Enviar correo ────────────────────────────────────────────────────────
    const mailOptions = {
      from: '"Empatia - Registro de Socios" <empatiadigital2025@gmail.com>',
      to: correo,
      subject: '¡Gracias y bienvenido a Empatia!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f8f8f8;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 30px;">
            <h2 style="color: #005b4f; text-align: center;">¡Bienvenido/a, ${nombre}!</h2>
            <p>Nos llena de alegría saber que decidiste ser parte de este espacio. A partir de ahora, ¡sos parte de algo mucho más grande!</p>

            <p>Guardá con cuidado estos datos, ya que los vas a necesitar para acceder por primera vez a la plataforma:</p>

            <ul style="background-color: #f0f4f3; padding: 15px; border-radius: 5px; list-style: none;">
              <li><strong>Usuario (email):</strong> ${username}</li>
              <li><strong>Contraseña provisoria:</strong> ${password}</li>
            </ul>

            <p style="margin-top: 20px;">Por tu seguridad, al ingresar por primera vez se te pedirá que cambies esta contraseña.</p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://empatiadigital.com.ar/login" target="_blank" style="background-color: #005b4f; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-size: 16px;">
                Ingresar a la plataforma
              </a>
            </div>

            <p>Ante cualquier duda, escribinos. ¡Gracias por confiar en Empatia!</p>
            <hr />
            <p style="font-size: 12px; color: #999; text-align: center;">Este mensaje fue enviado automáticamente. No respondas a este correo.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: 'Socio y usuario registrados correctamente',
      socio: nuevoSocio,
      user: { username },
    });

  } catch (error) {
    console.error('Error en registro de socio:', error);

    // Manejar error de índice único duplicado de Mongo (por si acaso)
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue || {})[0] || "dato";
      return res.status(400).json({
        success: false,
        message: `Ya existe un registro con ese ${campo}.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error del servidor',
    });
  }
};
