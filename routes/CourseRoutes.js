const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Rutas públicas
router.get('/active', courseController.getActiveCourse);

// Rutas protegidas (deberías agregar middleware de autenticación)
// Por ahora las dejo abiertas, pero en producción agrega auth middleware

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// Gestión de imágenes
router.post('/:id/image/main', courseController.uploadMainImage);
router.post('/:id/image/gallery', courseController.addGalleryImage);
router.delete('/:id/image/gallery/:imageId', courseController.deleteGalleryImage);

// Activar/desactivar curso
router.patch('/:id/toggle-status', courseController.toggleCourseStatus);

module.exports = router;
