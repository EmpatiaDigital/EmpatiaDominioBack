// models/TriviaPartida.js
const mongoose = require('mongoose');

const TriviaPartidaSchema = new mongoose.Schema({
  // null si es anonimo
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  // fingerprint para anonimos (mismo sistema que PostStats)
  visitorId: {
    type: String,
    required: true,
    index: true,
  },
  // IDs de preguntas jugadas en esta partida (del JSON, usamos el campo 'id' o indice)
  preguntasJugadas: {
    type: [String],
    default: [],
  },
  puntaje: {
    type: Number,
    required: true,
    min: 0,
  },
  puntajeMaximo: {
    type: Number,
    required: true,
  },
  porcentaje: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  respuestasCorrectas: {
    type: Number,
    required: true,
  },
  totalPreguntas: {
    type: Number,
    required: true,
  },
  rango: {
    type: String,
    enum: ['PRO', 'MEDIUM', 'APRENDIZ'],
    required: true,
  },
  completada: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // createdAt y updatedAt automaticos
});

// Indice compuesto para ranking por usuario
TriviaPartidaSchema.index({ userId: 1, puntaje: -1 });
// Indice para estadisticas globales
TriviaPartidaSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TriviaPartida', TriviaPartidaSchema);
