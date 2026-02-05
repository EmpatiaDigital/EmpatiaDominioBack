const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    default: 'Curso de Desarrollo Web'
  },
  descripcion: {
    type: String,
    default: 'Aprende las mejores prácticas del desarrollo web moderno'
  },
  imagenPrincipal: {
    type: String,
    default: ''
  },
  imagenesGaleria: [{
    url: String,
    publicId: String
  }],
  duracion: {
    type: String,
    default: '3 meses'
  },
  modalidad: {
    type: String,
    default: 'Presencial/Virtual'
  },
  precio: {
    type: String,
    default: 'Consultar'
  },
  horarios: {
    manana: {
      type: String,
      default: '9:00 - 12:00'
    },
    tarde: {
      type: String,
      default: '14:00 - 17:00'
    }
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaInicio: {
    type: Date
  },
  cuposDisponibles: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
