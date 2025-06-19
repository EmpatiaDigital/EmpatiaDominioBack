const Socio = require('../models/Socio');
const Post = require('../models/Post');
const { cloudinary } = require('../utils/cloudinary');

const editSocio = async (req, res) => {
  try {
    const {
      _id,
      nombre,
      apellido,
      telefono,
      provincia,
      ciudad
    } = req.body;

    if (!_id) {
      return res.status(400).json({ success: false, message: "Falta el ID del socio" });
    }

    const socio = await Socio.findById(_id);
    if (!socio) {
      return res.status(404).json({ success: false, message: "Socio no encontrado" });
    }

    // Guardamos valores anteriores para compararlos
    const autorViejo = `${socio.nombre?.trim() || ''} ${socio.apellido?.trim() || ''}`.trim();
    const avatarViejo = socio.avatar;

    // Actualizar campos
    socio.nombre = nombre || socio.nombre;
    socio.apellido = apellido || socio.apellido;
    socio.telefono = telefono || socio.telefono;
    socio.provincia = provincia || socio.provincia;
    socio.ciudad = ciudad || socio.ciudad;

    // Si hay nuevo avatar
    if (req.file) {
      const buffer = req.file.buffer;

      const uploadFromBuffer = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'socios' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(buffer);
        });

      const result = await uploadFromBuffer();
      socio.avatar = result.secure_url;
    }

    await socio.save();

    const autorNuevo = `${socio.nombre?.trim() || ''} ${socio.apellido?.trim() || ''}`.trim();

    // Armar campos a actualizar en los posts
    const updateFields = { autor: autorNuevo };
    if (socio.avatar && socio.avatar !== avatarViejo) {
      updateFields.avatar = socio.avatar;
    }

    // Actualizar todos los posts cuyo postId coincida con el _id del socio
    const updateResult = await Post.updateMany(
      { PostId: socio._id.toString() }, // aseguramos string
      { $set: updateFields }
    );

    console.log(`✅ Posts actualizados por PostId: ${updateResult.modifiedCount}`);

    res.json({
      success: true,
      message: "Socio y posts actualizados correctamente",
      socio
    });

  } catch (error) {
    console.error("❌ Error al editar socio:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

module.exports = { editSocio };
