const Socio = require('../models/Socio');
const Post = require('../models/Post');
const { cloudinary } = require('../utils/cloudinary');;

// Forzar config directo acá

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
      console.log('❌ Error: Falta el ID del socio');
      return res.status(400).json({ 
        success: false, 
        message: "Falta el ID del socio" 
      });
    }

    console.log('🔍 Buscando socio con ID:', _id);
    const socio = await Socio.findById(_id);

    if (!socio) {
      console.log('❌ Socio no encontrado con ID:', _id);
      return res.status(404).json({ 
        success: false, 
        message: "Socio no encontrado" 
      });
    }

    // Guardamos valores anteriores para compararlos
    const autorViejo = `${socio.nombre?.trim() || ''} ${socio.apellido?.trim() || ''}`.trim();
    const avatarViejo = socio.avatar;

    // Actualizar campos (solo si vienen en el body)
    if (nombre !== undefined) socio.nombre = nombre;
    if (apellido !== undefined) socio.apellido = apellido;
    if (telefono !== undefined) socio.telefono = telefono;
    if (provincia !== undefined) socio.provincia = provincia;
    if (ciudad !== undefined) socio.ciudad = ciudad;

    // Si hay nuevo avatar
    if (req.file) {
      console.log('📷 Procesando nuevo avatar...');
      console.log('Archivo:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const buffer = req.file.buffer;
      
      const uploadFromBuffer = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder: 'socios',
              resource_type: 'image'
            },
            (error, result) => {
              if (result) {
                console.log('✅ Avatar subido a Cloudinary:', result.secure_url);
                resolve(result);
              } else {
                console.error('❌ Error al subir a Cloudinary:', error);
                reject(error);
              }
            }
          );
          stream.end(buffer);
        });

      try {
        const result = await uploadFromBuffer();
        socio.avatar = result.secure_url;
        console.log('✅ Avatar actualizado en socio');
      } catch (uploadError) {
        console.error('❌ Error al subir imagen:', uploadError);
        return res.status(500).json({ 
          success: false, 
          message: "Error al subir la imagen" 
        });
      }
    } else {
      console.log('ℹ️ No se recibió archivo de imagen');
    }

    console.log('💾 Guardando socio...');
    await socio.save();

    const autorNuevo = `${socio.nombre?.trim() || ''} ${socio.apellido?.trim() || ''}`.trim();

    // Armar campos a actualizar en los posts
    const updateFields = { autor: autorNuevo };
    if (socio.avatar && socio.avatar !== avatarViejo) {
      updateFields.avatar = socio.avatar;
    }

    console.log('📝 Actualizando posts relacionados...');
    console.log('PostId a buscar:', socio._id.toString());
    console.log('Campos a actualizar:', updateFields);

    // Actualizar todos los posts cuyo postId coincida con el _id del socio
    const updateResult = await Post.updateMany(
      { PostId: socio._id.toString() },
      { $set: updateFields }
    );

    console.log(`✅ Posts actualizados: ${updateResult.modifiedCount}`);

    // Preparar respuesta con todos los datos actualizados
    const socioResponse = {
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
    };

    console.log('✅ Enviando respuesta exitosa');
    console.log('Socio response:', socioResponse);

    res.status(200).json({
      success: true,
      message: "Socio y posts actualizados correctamente",
      socio: socioResponse
    });

  } catch (error) {
    console.error("❌ Error al editar socio:", error);
    console.error("Stack:", error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: "Error del servidor",
      error: error.message 
    });
  }
};

module.exports = { editSocio };
