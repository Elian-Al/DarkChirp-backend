const Post = require('../models/posts');
const User = require('../models/users');
const Hashtag = require('../models/hashtags');

const extractHashtags = (text) => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);

    if (matches) {
        return matches.map(match => match.slice(1).toLowerCase());
    }
    return [];
};

//Création d'un nouveau post et extraction des Hashtags
exports.createPost = async (req, res) => {
    const userId = req.userId;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ result: false, message: 'Le contenu du post ne peut pas être vide.' });
    }

    try {
        const hashtagsArray = extractHashtags(content);                

        const newPost = new Post({
            user: userId,
            content: content,
            hashtags: hashtagsArray,
            likes: [],
            saved: [],
        });

        const savedPost = await newPost.save();

        if (hashtagsArray.length > 0) {
            console.log('hashtagsArray:', hashtagsArray);
            for (const tag of hashtagsArray) {
                await Hashtag.updateOne(
                    { name: tag.toLowerCase() },
                    { $inc: { count: 1 }},
                    { upsert: true, new: true }
                )
            }
        };

        res.status(201).json({
            result: true,
            message: 'Post publié avec succès !',
            data: savedPost
        });

    } catch (error) {
        console.error('Erreur lors de la création du post :', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ result: false, message: error.message });
        }

        res.status(500).json({ result: false, message: 'Erreur serveur lors de la publication.' });        
    }
};

//Récupération de tous les posts
exports.getAllPosts = async (req, res) => {
    try {
        const allPosts = await Post.find()
            .populate('user', 'username firstname lastname profilePicture')
            .sort({ createdAt: -1 });
            

        res.status(200).json({
            result: true,
            data: allPosts
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des posts :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de l\'affichage du fil d\'actualité.' });        
    }
};

//Suppression d'un post
exports.deletePost = async (req, res) => {
    const postId = req.params.postId;
    const userId = req.userId;

    try {
        const post = await Post.findById(postId);
        console.log(post.hashtags);

        if (!post) {
            return res.status(404).json({ result: false, message: 'Post non trouvé.' });
        }

        if (post.user.toString() !== userId) {
            return res.status(403).json({ result: false, message: 'Accès non autorisé. Vous ne pouvez supprimer que vos propres Posts.' });
        }

        await Post.deleteOne({ _id: postId });

        await User.updateMany(
            { $or: [{ likedPosts: postId }, { savedPosts: postId }] },
            { $pull: { likedPosts: postId, savedPosts: postId } }
        );

        if (post.hashtags.length > 0) {            
            for (let tag of post.hashtags) {
                await Hashtag.updateOne({ name: tag }, {$inc: {count: -1}});
            }
        }

        res.status(200).json({
            result: true,
            message: 'Post supprimé avec succès, et références nettoyées.'
        })

    } catch (error) {
        console.error('Erreur lors de la suppression du post :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la suppression.' });        
    }
};

//Like/UnLike un post
exports.likePost = async (req, res) => {
    const postId = req.params.postId;
    const userId = req.userId;
    console.log(postId, userId);
    

    try {
        const [post, user] = await Promise.all([
            Post.findById(postId),
            User.findById(userId)
        ]);

        if (!post || !user) {
            return res.status(404).json({ result: false, message: 'Post ou Utilisateur non trouvé.' });
        }

        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

            res.status(200).json({ result: true, message: 'Like retiré.', action: 'unlike' });
        } else {
            await Post.updateOne({ _id: postId }, { $push: { likes: userId } });
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

            res.status(200).json({ result: true, message: 'Like ajouté.', action: 'like' });
        }
    } catch (error) {
        console.error('Erreur lors du like/unlike :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de l\'opération Like.' });        
    }
};

//Save/UnSave un post
exports.savePost = async (req, res) => {
    const postId = req.params.postId; 
    const userId = req.userId;

    try {
        const [post, user] = await Promise.all([
            Post.findById(postId),
            User.findById(userId)
        ]);

        if (!post || !user) {
            return res.status(404).json({ result: false, message: 'Ressource (Post ou Utilisateur) non trouvée.' });
        }

        const isSaved = user.savedPosts.includes(postId);

        if (isSaved) {
            await Post.updateOne({ _id: postId }, { $pull: { saved: userId } });            
            await User.updateOne({ _id: userId }, { $pull: { savedPosts: postId } });

            res.status(200).json({ result: true, message: 'Chirp désauvegardé.', action: 'unsave' });

        } else {
            await Post.updateOne({ _id: postId }, { $push: { saved: userId } });
            await User.updateOne({ _id: userId }, { $push: { savedPosts: postId } });

            res.status(200).json({ result: true, message: 'Chirp sauvegardé.', action: 'save' });
        }

    } catch (error) {
        console.error('Erreur lors de la sauvegarde/désauvegarde :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de l\'opération de sauvegarde.' });
    }
};

//Récupérer les Hashtags les plus utilisés
exports.getTrendingHashtag = async (req, res) => {
    try {
        const trendingHashtags = await Hashtag.find({ count: { $gt: 0 }}).sort({count: -1})

        res.status(200).json({
            result: true,
            trendingHashtags,
        });
    } catch (error) {
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la récurpération des données.' });        
    }
};

//Récupérer les posts par leur Hashtags
exports.getPostsByHashtag = async (req, res) => {
    const hashtagName = req.params.hashtagName;

    if (!hashtagName) {
        return res.status(400).json({ result: false, message: 'Le nom du hashtag est manquant.' });
    }

    try {
        const posts = await Post.find({
            hashtags: { $in: hashtagName.toLowerCase() }
        })
            .populate('user', 'username firstname lastname profilePicture')
            .sort({ createdAt: -1 });
        
        if (posts.length === 0) {
            return res.status(200).json({ result: true, message: `Aucun Post trouvé pour #${hashtagName}.`, data: [] });
        }

        res.status(200).json({
            result: true,
            message: `${posts.length} Posts trouvés.`,
            data: posts
        });

    } catch (error) {
        console.error('Erreur lors de la recherche par hashtag :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors du filtrage.' });
    }
};

//Récupérer tous les posts d'un utilisateur
exports.getAllUserPosts = async (req, res) => {
    const userId = req.userId;
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const userPosts = await Post.find({user: userId})
            .skip(skip)
            .limit(limit)
            .populate('user', 'username firstname lastname profilePicture')
            .sort({ createdAt: -1 })
        
        console.log(userPosts.length);        

        res.status(200).json({
            result: true,
            data: userPosts,
            count: userPosts.length,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des posts :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la récupération des Posts de l\'utilisateur.' });
    }
};

//Récupéré tous les posts qu'un utilisateur à aimé
exports.getLikedPosts = async (req, res) => {
    const userId = req.userId;
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const userLikedPosts = await User.findById(userId).select('likedPosts')
            
        const likedPosts = await Post.find({_id: { $in: userLikedPosts.likedPosts }})
            .skip(skip)
            .limit(limit)
            .populate('user', 'username firstname lastname profilePicture')
            .sort({ createdAt: -1 })
            
        console.log(likedPosts);

        res.status(200).json({
            result: true,
            data: likedPosts,
            nbrOfPosts: likedPosts.length,
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des posts :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la récupération des Posts.' });
    }
};

//Récupéré tous les postes qu'un utilisateur a sauvegardé
exports.getSavedPosts = async (req, res) => {
    const userId = req.userId;
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const userSavedPosts = await User.findById(userId).select('savedPosts')        

        const savedPosts = await Post.find({_id: { $in: userSavedPosts.savedPosts }})
            .skip(skip)
            .limit(limit)
            .populate('user', 'username firstname lastname profilePicture')
            .sort({ createdAt: -1 })

        console.log('Saved Posts :', savedPosts);

        res.status(200).json({
            result: true,
            data: savedPosts,
            nbrOfPosts: savedPosts.length,
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des posts :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la récupération des Posts.' });
    }
};

