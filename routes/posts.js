var express = require('express');
var router = express.Router();
const authMiddleware = require('../middlewares/auth');
const postController = require('../controllers/post.controller');

// POST /posts/new : Créer un nouveau post
router.post('/new', authMiddleware, postController.createPost);

// GET /posts/ : Récupérer le fil d'actualité (tous les Chirps)
router.get('/', postController.getAllPosts);

// DELETE /posts/:postId : Supprimer un Chirp
router.delete('/:postId', authMiddleware, postController.deletePost);

// Route Like/Unlike (Protégée)
router.post('/like/:postId', authMiddleware, postController.likePost);

// Route Save/Unsave (Protégée)
router.post('/save/:postId', authMiddleware, postController.savePost);

// Route Filtrage par Hashtag (Peut être publique)
router.get('/hashtag/:hashtagName', postController.getPostsByHashtag);

//Récuperer les posts d'un utilisateur
router.get('/user/mine', authMiddleware, postController.getAllUserPosts);

//Récuperer les posts liké par l'utilisateur
router.get('/user/liked', authMiddleware, postController.getLikedPosts);

//Récuperer les posts liké par l'utilisateur
router.get('/user/saved', authMiddleware, postController.getSavedPosts);


module.exports = router;
