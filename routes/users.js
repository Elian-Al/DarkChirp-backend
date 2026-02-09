var express = require('express');
var router = express.Router();
const authController = require('../controllers/auth.controllers');
const authMiddleware = require('../middlewares/auth');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Création d'un utilisateur
router.post('/signup', authController.signup);

//Connexion d'un utilisateur
router.post('/signin', authController.signin);

//Récupérer les informations actualiser de l'utilisateur
router.get('/me', authMiddleware, authController.me);

//Supprimer le compte de l'utilisateur et le contenu associé
router.delete('/delete-account', authMiddleware, authController.deleteUser);

//Récupérer les informations du profil

//Mettre à jour les informations du profil

//Récuperer les posts sauvegardé par l'utilisateur

//Changer l'image de profil de l'utilisateur

module.exports = router;
