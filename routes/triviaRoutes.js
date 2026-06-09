// routes/triviaRoutes.js
// Montar en index.js: app.use('/api/trivia', require('./routes/triviaRoutes'));

const express = require('express');
const router  = express.Router();
const TriviaPartida = require('../models/TriviaPartida');
const jwt = require('jsonwebtoken');

// ─── Helper: extrae userId del token si existe, sin bloquear ─────────────────
const getUserIdFromToken = (req) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    return payload.userId || payload.id || null;
  } catch {
    return null;
  }
};

// ─── POST /api/trivia/partida — Guardar partida al terminar ──────────────────
router.post('/partida', async (req, res) => {
  const {
    visitorId,
    preguntasJugadas,
    puntaje,
    puntajeMaximo,
    porcentaje,
    respuestasCorrectas,
    totalPreguntas,
    rango,
  } = req.body;

  if (!visitorId) return res.status(400).json({ error: 'visitorId requerido' });
  if (puntaje === undefined || !rango) return res.status(400).json({ error: 'Datos de partida incompletos' });

  try {
    const userId = getUserIdFromToken(req);

    const partida = await TriviaPartida.create({
      userId,
      visitorId,
      preguntasJugadas: preguntasJugadas || [],
      puntaje,
      puntajeMaximo,
      porcentaje,
      respuestasCorrectas,
      totalPreguntas,
      rango,
      completada: true,
    });

    res.status(201).json({ ok: true, partidaId: partida._id });
  } catch (err) {
    console.error('Error guardando partida:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── GET /api/trivia/ranking — Top 10 usuarios logueados ────────────────────
router.get('/ranking', async (req, res) => {
  try {
    const ranking = await TriviaPartida.aggregate([
      { $match: { userId: { $ne: null }, completada: true } },
      // Mejor partida por usuario
      {
        $group: {
          _id: '$userId',
          mejorPuntaje:    { $max: '$puntaje' },
          totalPartidas:   { $sum: 1 },
          porcentajePromedio: { $avg: '$porcentaje' },
          mejorRango:      { $first: '$rango' },
          ultimaPartida:   { $max: '$createdAt' },
        },
      },
      { $sort: { mejorPuntaje: -1, porcentajePromedio: -1 } },
      { $limit: 10 },
      // Join con coleccion de usuarios para traer el nombre
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: { path: '$usuario', preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          nombre: { $ifNull: ['$usuario.nombre', '$usuario.name', 'Usuario'] },
          avatar: { $ifNull: ['$usuario.avatar', null] },
          mejorPuntaje: 1,
          totalPartidas: 1,
          porcentajePromedio: { $round: ['$porcentajePromedio', 0] },
          mejorRango: 1,
          ultimaPartida: 1,
        },
      },
    ]);

    res.json(ranking);
  } catch (err) {
    console.error('Error obteniendo ranking:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── GET /api/trivia/mis-partidas — Historial del usuario logueado ───────────
router.get('/mis-partidas', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  try {
    const partidas = await TriviaPartida.find({ userId, completada: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('puntaje puntajeMaximo porcentaje respuestasCorrectas totalPreguntas rango createdAt');

    res.json(partidas);
  } catch (err) {
    console.error('Error obteniendo historial:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── GET /api/trivia/stats — Estadisticas globales (admin) ──────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totales] = await TriviaPartida.aggregate([
      { $match: { completada: true } },
      {
        $group: {
          _id: null,
          totalPartidas:      { $sum: 1 },
          promedioGlobal:     { $avg: '$porcentaje' },
          puntajeMaximoEver:  { $max: '$puntaje' },
          totalJugadoresUnicos: { $addToSet: '$visitorId' },
        },
      },
      {
        $project: {
          _id: 0,
          totalPartidas: 1,
          promedioGlobal: { $round: ['$promedioGlobal', 1] },
          puntajeMaximoEver: 1,
          totalJugadoresUnicos: { $size: '$totalJugadoresUnicos' },
        },
      },
    ]);

    const distribucionRangos = await TriviaPartida.aggregate([
      { $match: { completada: true } },
      { $group: { _id: '$rango', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
    ]);

    res.json({ ...(totales || {}), distribucionRangos });
  } catch (err) {
    console.error('Error obteniendo stats globales:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
