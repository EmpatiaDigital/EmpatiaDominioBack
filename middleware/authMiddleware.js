const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      req.user = user;
      next();
    } catch (error) {
      console.error("Error al verificar token:", error);
      res.status(401).json({ error: "Token inválido" });
    }
  };
  

module.exports = authMiddleware;
