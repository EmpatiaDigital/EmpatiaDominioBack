const express = require('express');
const router = express.Router();
const inscriptionController = require('../controllers/inscriptionController');

// Ruta pública - Crear inscripción
router.post('/', inscriptionController.createInscription);

// Rutas protegidas (agregar middleware de autenticación en producción)
router.get('/', inscriptionController.getAllInscriptions);
router.get('/statistics', inscriptionController.getStatistics);
router.get('/:id', inscriptionController.getInscriptionById);
router.put('/:id', inscriptionController.updateInscription);
router.patch('/:id/status', inscriptionController.updateInscriptionStatus);
router.delete('/:id', inscriptionController.deleteInscription);

module.exports = router;
