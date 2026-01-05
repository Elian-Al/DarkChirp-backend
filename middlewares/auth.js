const jwt = require('jsonwebtoken');

/*
Le Middleware qui vérifie la présence et la validité du Token JWT.
S'il est valide, il injecte l'ID de l'utilisateur dans l'objet req.
 */

module.exports = (req, res, next) => {
  try {
    // 1. Récupération et vérification du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token ou format incorrect
      return res.status(401).json({ 
        result: false, 
        message: 'Authentification requise. Format: Bearer <token>' 
      });
    }

    // 2. Extraction du token (suppression de "Bearer ")
    const token = authHeader.split(' ')[1];
    

    // 3. Vérification et décodage du token
    // La fonction vérifie la signature du token avec la clé secrète (.env)
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Le payload décodé contient l'ID de l'utilisateur que nous avons généré au signin
    const userId = decodedToken.userId;

    // 4. Ajout de l'ID de l'utilisateur à l'objet requête
    // C'est CRUCIAL. Cela permet aux contrôleurs (ex: createPost) de savoir qui poste.
    req.userId = userId;

    // 5. Tout est valide, on passe au contrôleur suivant.
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