const Inscription = require('../models/Inscription');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Transportador con Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "empatiadigital2025@gmail.com",
    pass: "ebqd hhyo schf hlxc",
  },
});

// Función para enviar email de bienvenida
const enviarEmailBienvenida = async (inscription, course) => {
  const mailOptions = {
    from: '"Empatía Digital" <empatiadigital2025@gmail.com>',
    to: inscription.email,
    subject: `¡Gracias por tu interés en ${course.titulo}!`,
    html: `
    <div style="font-family: 'Arial', sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #ddd;">
      <h2 style="color: #2c3e50; text-align: center;">¡Bienvenido/a a Empatía Digital!</h2>
      
      <p style="font-size: 16px; color: #555;">Hola <strong>${inscription.nombre} ${inscription.apellido}</strong>,</p>
      
      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        ¡Gracias por tu interés en nuestro curso <strong>${course.titulo}</strong>! 
        Estamos muy contentos de que quieras formar parte de esta experiencia de aprendizaje.
      </p>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: #27ae60; margin-top: 0;">📋 Detalles de tu inscripción:</h3>
        <p style="margin: 5px 0; color: #555;"><strong>Curso:</strong> ${course.titulo}</p>
        <p style="margin: 5px 0; color: #555;"><strong>Turno preferido:</strong> ${inscription.turnoPreferido}</p>
        <p style="margin: 5px 0; color: #555;"><strong>Email:</strong> ${inscription.email}</p>
        <p style="margin: 5px 0; color: #555;"><strong>Celular:</strong> ${inscription.celular}</p>
      </div>

      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        Para estar al tanto de todas las novedades, información actualizada del curso y conectar con otros participantes, 
        te invitamos a sumarte a nuestro grupo de WhatsApp:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://chat.whatsapp.com/BMAjGTfb00B5qGMBxehk7X?mode=gi_t" 
           style="background-color: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          📱 Sumate al grupo de WhatsApp ahora
        </a>
      </div>

      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        En breve nos pondremos en contacto contigo para brindarte más información sobre el curso.
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

      <p style="font-size: 13px; color: #777; text-align: center;">
        Si tenés alguna consulta, no dudes en contactarnos.
      </p>

      <p style="font-size: 12px; color: #aaa; margin-top: 20px; text-align: center;">
        Enviado automáticamente por Empatía Digital.
      </p>
    </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Crear nueva inscripción (público) - CON GESTIÓN DE CUPOS Y ENVÍO DE EMAIL
exports.createInscription = async (req, res) => {
  // Iniciar sesión de transacción para operaciones atómicas
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { nombre, apellido, email, celular, turnoPreferido, aceptaTerminos, courseId } = req.body;

    // Validar que el curso exista y esté activo
    const course = await Course.findById(courseId).session(session);
    if (!course) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Curso no encontrado' });
    }
    
    if (!course.activo) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'El curso no está disponible para inscripciones' });
    }

    // Verificar cupos disponibles
    if (course.cuposDisponibles <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'No hay cupos disponibles para este curso' 
      });
    }

    // Verificar si ya existe una inscripción con este email para este curso
    const existingInscription = await Inscription.findOne({ 
      email, 
      courseId 
    }).session(session);

    if (existingInscription) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Ya existe una inscripción con este email para este curso' 
      });
    }

    // Decrementar cupo de forma atómica (previene race conditions)
    const updatedCourse = await Course.findOneAndUpdate(
      {
        _id: courseId,
        cuposDisponibles: { $gt: 0 } // Solo actualiza si hay cupos disponibles
      },
      {
        $inc: { cuposDisponibles: -1 } // Decrementa en 1
      },
      {
        new: true,
        session
      }
    );

    if (!updatedCourse) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'No hay cupos disponibles (otro usuario acaba de tomar el último cupo)' 
      });
    }

    // Crear inscripción
    const inscription = new Inscription({
      nombre,
      apellido,
      email,
      celular,
      turnoPreferido,
      aceptaTerminos,
      courseId
    });

    await inscription.save({ session });

    // Confirmar transacción
    await session.commitTransaction();

    // 📧 Enviar email de bienvenida (fuera de la transacción)
    try {
      await enviarEmailBienvenida(inscription, updatedCourse);
    } catch (emailError) {
      console.error('Error al enviar email de bienvenida:', emailError);
      // No fallar la inscripción si el email falla
    }

    res.status(201).json({
      message: 'Inscripción realizada exitosamente',
      inscription,
      cuposRestantes: updatedCourse.cuposDisponibles
    });

  } catch (error) {
    await session.abortTransaction();
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    console.error('Error en createInscription:', error);
    res.status(500).json({ 
      message: 'Error al procesar la inscripción', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

// Obtener todas las inscripciones (admin)
exports.getAllInscriptions = async (req, res) => {
  try {
    const { courseId, estado, search } = req.query;
    
    let query = {};
    
    if (courseId) {
      query.courseId = courseId;
    }
    
    if (estado) {
      query.estado = estado;
    }

    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { apellido: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { celular: { $regex: search, $options: 'i' } }
      ];
    }

    const inscriptions = await Inscription.find(query)
      .populate('courseId', 'titulo')
      .sort({ createdAt: -1 });

    res.json(inscriptions);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener inscripciones', 
      error: error.message 
    });
  }
};

// Obtener inscripción por ID
exports.getInscriptionById = async (req, res) => {
  try {
    const inscription = await Inscription.findById(req.params.id)
      .populate('courseId');
    
    if (!inscription) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }

    res.json(inscription);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener inscripción', 
      error: error.message 
    });
  }
};

// Actualizar estado de inscripción (admin)
exports.updateInscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    const inscription = await Inscription.findByIdAndUpdate(
      id,
      { estado, notas },
      { new: true, runValidators: true }
    ).populate('courseId');

    if (!inscription) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      inscription
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar inscripción', 
      error: error.message 
    });
  }
};

// Actualizar inscripción completa (admin)
exports.updateInscription = async (req, res) => {
  try {
    const inscription = await Inscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('courseId');

    if (!inscription) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }

    res.json({
      message: 'Inscripción actualizada exitosamente',
      inscription
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar inscripción', 
      error: error.message 
    });
  }
};

// Eliminar inscripción (admin) - DEVUELVE EL CUPO AL CURSO
exports.deleteInscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const inscription = await Inscription.findById(req.params.id).session(session);
    
    if (!inscription) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }

    // Devolver el cupo al curso
    await Course.findByIdAndUpdate(
      inscription.courseId,
      { $inc: { cuposDisponibles: 1 } }, // Incrementa en 1
      { session }
    );

    // Eliminar inscripción
    await Inscription.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();

    res.json({ message: 'Inscripción eliminada exitosamente y cupo liberado' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ 
      message: 'Error al eliminar inscripción', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

// Obtener estadísticas (admin)
exports.getStatistics = async (req, res) => {
  try {
    const { courseId } = req.query;
    
    let matchQuery = {};
    if (courseId) {
      matchQuery.courseId = mongoose.Types.ObjectId(courseId);
    }

    const stats = await Inscription.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pendientes: {
            $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] }
          },
          confirmados: {
            $sum: { $cond: [{ $eq: ['$estado', 'confirmado'] }, 1, 0] }
          },
          cancelados: {
            $sum: { $cond: [{ $eq: ['$estado', 'cancelado'] }, 1, 0] }
          },
          turnoManana: {
            $sum: { $cond: [{ $eq: ['$turnoPreferido', 'mañana'] }, 1, 0] }
          },
          turnoTarde: {
            $sum: { $cond: [{ $eq: ['$turnoPreferido', 'tarde'] }, 1, 0] }
          },
          turnoIndistinto: {
            $sum: { $cond: [{ $eq: ['$turnoPreferido', 'indistinto'] }, 1, 0] }
          }
        }
      }
    ]);

    const statistics = stats.length > 0 ? stats[0] : {
      total: 0,
      pendientes: 0,
      confirmados: 0,
      cancelados: 0,
      turnoManana: 0,
      turnoTarde: 0,
      turnoIndistinto: 0
    };

    delete statistics._id;

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener estadísticas', 
      error: error.message 
    });
  }
};
