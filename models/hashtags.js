const mongoose = require ('mongoose');
const { Schema } = mongoose;

const hashtagSchema = new Schema({
    name: {
        type: String,
        unique: true,
        lowercase: true,
    },
    count: {
        type: Number,
        default: 0,
    }
});

const Hashtag = mongoose.model('hashtags', hashtagSchema);

module.exports = Hashtag;