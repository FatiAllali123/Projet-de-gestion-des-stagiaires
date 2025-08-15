// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = {
  // Middleware qui vérifie que l'utilisateur est authentifié
  authenticate: (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: "Token manquant" });

      // Vérifie le token et extrait les données
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Ajoute les infos utilisateur à la requête
      next();
    } catch (error) {
      res.status(403).json({ error: "Token invalide" });
    }
  },

  // Vérifie que l'utilisateur est admin
  isAdmin: (req, res, next) => {
    if (req.user?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: "Accès refusé : droits admin requis" });
    }
  }

  ,   


  // Vérifie que l'utilisateur est admin
  isRH: (req, res, next) => {
    if (req.user?.role === 'rh') {
      next();
    } else {
      res.status(403).json({ error: "Accès refusé : droits rh requis" });
    }
  } ,
   isEncadrant: (req, res, next) => {
    if (req.user?.role === 'encadrant') {
      next();
    } else {
      res.status(403).json({ error: "Accès refusé : droits encadrant requis" });
    }
  },
   isCandidat: (req, res, next) => {
    if (req.user?.role === 'candidat') {
      next();
    } else {
      res.status(403).json({ error: "Accès refusé : droits encadrant requis" });
    }
  },

 isAdminOrRH(req, res, next) {
  const role = req.user.role;
  if (role === 'admin' || role === 'rh') {
    return next();
  } else {
    return res.status(403).json({ message: 'Accès refusé' });
  }
}

};