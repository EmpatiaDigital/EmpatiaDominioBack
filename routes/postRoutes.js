const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// Crear un nuevo post
router.post('/posts', postController.crearPost);

// Obtener todos los posts
router.get('/posts', postController.obtenerPosts);

// Obtener un post por ID
router.get('/posts/:PostId', postController.obtenerPostPorId);

// Actualizar un post por ID
router.put('/posts/:PostId', postController.actualizarPost);

// Eliminar un post por ID
router.delete('/posts/:PostId', postController.eliminarPost);

module.exports = router;
