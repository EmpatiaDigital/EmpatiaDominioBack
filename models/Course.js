const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  duracion: {
    type: String,
    required: true
  },
  modalidad: {
    type: String,
    required: true
  },
  precio: {
    type: String,
    required: true
  },
  cuposDisponibles: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  cuposTotales: {
    type: Number,
    required: true,
    min: 1,
    default: 30
  },
  horarios: {
    manana: String,
    tarde: String
  },
  imagenPrincipal: {
    type: String,
    default: ''
  },
  imagenesGaleria: [{
    url: String,
    publicId: String
  }],
  activo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
