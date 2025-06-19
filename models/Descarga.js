// models/Descarga.js
const mongoose = require("mongoose");

const DescargaSchema = new mongoose.Schema({
  type: String,
  title: String,
  filename: String,
  portada: String,
  fileData: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Descarga", DescargaSchema);
