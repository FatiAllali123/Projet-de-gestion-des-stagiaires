// middlewares/accountStatus.js
module.exports = (req, res, next) => {
  if (req.user?.statut !== 'actif') {
    return res.status(403).json({ 
      error: "Action impossible",
      details: `Votre compte est ${req.user?.statut || 'inactif'}`
    });
  }
  next();
};