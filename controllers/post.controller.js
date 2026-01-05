const Post = require('../models/posts');
const User = require('../models/users');

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

//Récupérer les posts par leur Hashtags
exports.getPostsByHashtag = async (req, res) => {
    const hashtagName = req.params.hashtagName;

    if (!hashtagName) {
        return res.status(400).json({ result: false, message: 'Le nom du hashtag est manquant.' });
    }

    try {
        const posts = await Post.find({
            hashtags: { $in: [hashtagName.toLowerCase()] }
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
}

