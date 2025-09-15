const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
    if (!token) return res.status(401).json({ error: 'Token inválido' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({ error: 'No tienes permisos para esta acción' });
      }

      next();
    } catch (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
  };
};

module.exports = auth;
