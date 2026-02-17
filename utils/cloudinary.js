const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name:"dnodisza5",
  api_key: "713585429952622",
  api_secret:"Xi0UEkmnjB6PllVt2W5871s8pJ0",
});

// Configuración de Multer para subir archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = { cloudinary, upload };

