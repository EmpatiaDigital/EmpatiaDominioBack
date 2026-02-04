const Inscription = require('../models/Inscription');
const Course = require('../models/Course');

// Crear nueva inscripción (público)
exports.createInscription = async (req, res) => {
  try {
    const { nombre, apellido, email, celular, turnoPreferido, aceptaTerminos, courseId } = req.body;

    // Validar que el curso exista y esté activo
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }
    if (!course.activo) {
      return res.status(400).json({ message: 'El curso no está disponible para inscripciones' });
    }

    // Verificar si ya existe una inscripción con este email para este curso
    const existingInscription = await Inscription.findOne({ email, courseId });
    if (existingInscription) {
      return res.status(400).json({ 
        message: 'Ya existe una inscripción con este email para este curso' 
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

    await inscription.save();

    res.status(201).json({
      message: 'Inscripción realizada exitosamente',
      inscription
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ 
      message: 'Error al procesar la inscripción', 
      error: error.message 
    });
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

// Eliminar inscripción (admin)
exports.deleteInscription = async (req, res) => {
  try {
    const inscription = await Inscription.findByIdAndDelete(req.params.id);
    
    if (!inscription) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }

    res.json({ message: 'Inscripción eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar inscripción', 
      error: error.message 
    });
  }
};

// Obtener estadísticas (admin)
exports.getStatistics = async (req, res) => {
  try {
    const { courseId } = req.query;
    
    let matchQuery = {};
    if (courseId) {
      matchQuery.courseId = require('mongoose').Types.ObjectId(courseId);
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
