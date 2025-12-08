const mongoose = require ('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'L\'auteur du post est obligatoire.'],
    },
    content: {
        type: String,
        required: [true, 'Le contenu du post ne peut pas être vide.'],
        trim: true,
        maxLength: [280, 'Un post ne peut pas dépasser 280 caractères.'],
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
    }],
    saved: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
    }],
    hashtags: [{
        type: String,
        lowercase: true,
        trim: true,
    }],
}, {
    timestamps: true,
});

postSchema.index({ hashtags: 1});
postSchema.index({ user: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('posts', postSchema);

module.exports = Post;