const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret:process.env.API_SECRET,
});

// Configuración de Multer para subir archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = { cloudinary, upload };
