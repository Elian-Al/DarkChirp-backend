const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

//Nombre de hachage
const hashRounds = 10;

//Inscription
exports.signup = async (req, res) => {
    const { username, firstname, password} = req.body;

    if (!username || !firstname || !password) {
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
            password: hashedPassword,
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            result: true,
            message: 'Compte créé avec succès !',
            data: {
                username: savedUser.username,
                firstname: savedUser.firstname,
                lastname: savedUser.firstname,
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
            likedPosts: user.likedPosts,
            savedPosts: user.savedPosts,
        });

    } catch (error) {
        console.error('Erreur lors du signin :', error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la connexion.' });
    }
}