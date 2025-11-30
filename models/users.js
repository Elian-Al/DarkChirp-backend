const mongoose = require ('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Le nom d\'utilisateur est obligatoire.'],
        unique: true,
        trim: true,
        minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères.'],
    },
    firstname: {
        type: String,
        required: [true, 'Le prénom est obligatoire.'],
        trim: true,
    },
    lastname: {
        type: String,
        required: [true, 'Le nom est obligatoire.'],
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire.'],
    },
    token: String,
    profilePicture: String,
    bio: String,
    likedPosts: [{
        type: Schema.Types.ObjectId,
        ref: 'Posts',
    }],
    savedPosts: [{
        type: Schema.Types.ObjectId,
        ref: 'Posts',
    }]
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;