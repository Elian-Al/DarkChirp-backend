const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Post = require('../models/posts');
const Hashtag = require('../models/hashtags');

//Nombre de hachage
const hashRounds = 10;

//Inscription
exports.signup = async (req, res) => {
    const { username, firstname, lastname, email, password} = req.body;

    if (!username || !firstname || !lastname || !email || !password) {
        return res.status(400).json({ result: false, message : 'Tous les champs sont requis.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ result: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    try {
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ result: false, message: 'Ce nom d\'utilisateur est déjà pris'});
        }

        //Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, hashRounds)

        //Création du nouvel utilisateur en BDD
        const newUser = new User({
            username: username.toLowerCase(),
            firstname,
            lastname,
            email,
            password: hashedPassword,
            profilePicture: "",
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            result: true,
            message: 'Compte créé avec succès !',
            data: {
                username: savedUser.username,
                firstname: savedUser.firstname,
                lastname: savedUser.lastname,
                email: savedUser.email,
            }
        });

    } catch (error) {
        console.error('Erreur lors de la création du compte :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de l\'inscription.'});
    }
};

//Connexion
exports.signin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ result: false, message: 'Veuillez saisr le nom d\'utilisateur et le mot de passe.' });
    }

    try {
        //Vérification de l'éxistence de l'utilisateur
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({ result: false, message: 'Identifiant ou mot de passe incorrect.' });
        }        

        //Comparaison du mot de passe haché
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ result: false, message: 'Identifiants ou mot de passe incorrect.' });
        }

        //Génération du Token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
        );

        await User.updateOne({ _id: user._id }, { token });

        res.status(200).json({
            result: true,
            token,
            username: user.username,
            firstname: user.firstname,
            email: user.email,
            likedPosts: user.likedPosts,
            savedPosts: user.savedPosts,
            profilePicture: user.profilePicture,
        });

    } catch (error) {
        console.error('Erreur lors du signin :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la connexion.' });
    }
};

//Récupérer les infos de l'utilisateur
exports.me = async (req, res) => {
    const userId = req.userId;

    try {
        const userData = await User.findById(userId).select('-_id -password -createdAt -updatedAt -__v').lean();

        res.status(201).json({
            result: true,
            userData,
        })
        
    } catch (error) {
        return res.status(500).json({ result: false, message: 'Erreur lors de la récupération des informations de l\'utilisateur'})
    }
    
};

//Supprimer le compte de l'utilisateur
exports.deleteUser = async (req, res) => {
    const { password } = req.body;
    const userId = req.userId;    

    try {
        const user = await User.findById(userId);

        //Comparaison du mot de passe haché
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ result: false, message: 'Mot de passe incorect.' });
        }

        const userPosts = await Post.find({ user: userId});

        for (const post of userPosts) {
            if (post.hashtags.length > 0) {
                const isUpdated = await Promise.all(post.hashtags.map(tag => 
                    Hashtag.updateOne({ name: tag }, { $inc: { count: -1 } })
                ));                
            };
        };

        await Post.deleteMany({ user: userId });

        await Post.updateMany(
            { $or: [{ likes: userId }, { saved: userId }] },
            { $pull: { likes: userId, saved: userId } }
        );

        await User.deleteOne({ _id: userId });

        res.status(200).json({
            result: true,
            message: "Compte et données associées supprimés avec succès.",
        });

    } catch (error) {
        console.error("Erreur suppression compte :", error);        
        return res.status(500).json({ result: false, message: 'Erreur serveur.'})
    }
};