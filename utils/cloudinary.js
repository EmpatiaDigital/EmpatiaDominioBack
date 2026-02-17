const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dnodisza5",
  api_key: process.env.CLOUDINARY_API_KEY || "713585429952622",
  api_secret: process.env.CLOUDINARY_API_SECRET || "Xi0UEkmnjB6PllVt2W5871s8pJ0",
});

console.log('=== CLOUDINARY CONFIG ===');
console.log('cloud_name:', cloudinary.config().cloud_name);
console.log('api_key:', cloudinary.config().api_key);
console.log('========================');

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = { cloudinary, upload };
