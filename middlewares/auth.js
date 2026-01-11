const jwt = require('jsonwebtoken');

/*
Le Middleware qui vérifie la présence et la validité du Token JWT.
S'il est valide, il injecte l'ID de l'utilisateur dans l'objet req.
 */

module.exports = (req, res, next) => {
  try {
    // Récupération et vérification du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token ou format incorrect
      return res.status(401).json({ 
        result: false, 
        message: 'Authentification requise. Format: Bearer <token>' 
      });
    }

    // Extraction du token (suppression de "Bearer ")
    const token = authHeader.split(' ')[1];
    
    // Vérification et décodage du token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Le payload décodé contient l'ID de l'utilisateur que nous avons généré au signin
    const userId = decodedToken.userId;

    // Ajout de l'ID de l'utilisateur à l'objet requête    
    req.userId = userId;

    // Tout est valide, on passe au contrôleur suivant.
    next();

  } catch (error) {
    // Gère toutes les erreurs (Token invalide, Token expiré, etc.)
    console.error('Erreur d\'authentification par JWT :', error.message);
    res.status(401).json({ 
      result: false, 
      message: 'Accès refusé. Jeton invalide ou expiré.' 
    });
  }
};