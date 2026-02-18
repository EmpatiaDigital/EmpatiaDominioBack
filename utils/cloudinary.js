const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('CLOUDINARY CLOUD NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY API KEY:', process.env.CLOUDINARY_API_KEY);

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = { cloudinary, upload };
