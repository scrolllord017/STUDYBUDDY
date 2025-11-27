const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['Notes', 'Video', 'Article', 'Tutorial', 'Resource'],
        default: 'Article'
    },
    tags: [{
        type: String,
        trim: true
    }],
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document']
        },
        url: String,
        filename: String
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

postSchema.index({ title: 'text', description: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);