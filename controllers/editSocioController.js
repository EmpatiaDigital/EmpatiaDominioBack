const Socio = require('../models/Socio');
const Post = require('../models/Post');

// Configuración directa de Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: "dnodisza5",
  api_key: "713585429952622",
  api_secret: "Xi0UEkmnjB6PllVt2W5871s8pJ0",
});

const editSocio = async (req, res) => {
  try {
    console.log('=== DATOS RECIBIDOS EN BACKEND ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Cloudinary config:', cloudinary.config());

    const { _id, nombre, apellido, telefono, provincia, ciudad } = req.body;

    if (!_id) {
      return res.status(400).json({ success: false, message: "Falta el ID del socio" });
    }

    const socio = await Socio.findById(_id);

    if (!socio) {
      return res.status(404).json({ success: false, message: "Socio no encontrado" });
    }

    const autorViejo = `${socio.nombre?.trim() || ''} ${socio.apellido?.trim() || ''}`.trim();
    const avatarViejo = socio.avatar;

    if (nombre !== undefined) socio.nombre = nombre;
    if (apellido !== undefined) socio.apellido = apellido;
    if (telefono !== undefined) socio.telefono = telefono;
    if (provincia !== undefined) socio.provincia = provincia;
    if (ciudad !== undefined) socio.ciudad = ciudad;

    if (req.file) {
      console.log('📷 Procesando nuevo avatar...');

      const uploadFromBuffer = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'socios', resource_type: 'image' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(req.file.buffer);
        });

      try {
        const result = await uploadFromBuffer();
        socio.avatar = result.secure_url;
        console.log('✅ Avatar subido:', result.secure_url);
      } catch (uploadError) {
        console.error('❌ Error al subir imagen:', uploadError);
        return res.status(500).json({ success: false, message: "Error al subir la imagen" });
      }
    }

    await socio.save();

    const autorNuevo = `${socio.nombre?.trim() || ''} ${socio.apellido?.trim() || ''}`.trim();

    const updateFields = { autor: autorNuevo };
    if (socio.avatar && socio.avatar !== avatarViejo) {
      updateFields.avatar = socio.avatar;
    }

    await Post.updateMany(
      { PostId: socio._id.toString() },
      { $set: updateFields }
    );

    res.status(200).json({
      success: true,
      message: "Socio y posts actualizados correctamente",
      socio: {
        _id: socio._id,
        nombre: socio.nombre,
        apellido: socio.apellido,
        correo: socio.correo,
        telefono: socio.telefono,
        provincia: socio.provincia,
        ciudad: socio.ciudad,
        numeroSocio: socio.numeroSocio,
        avatar: socio.avatar,
        active: socio.active,
        cuotaEstado: socio.cuotaEstado
      }
    });

  } catch (error) {
    console.error("❌ Error al editar socio:", error);
    res.status(500).json({ success: false, message: "Error del servidor", error: error.message });
  }
};

module.exports = { editSocio };
