const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all posts with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments();

        res.json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username profilePicture');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Increment views
        post.views += 1;
        await post.save();

        res.json({ post });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create post
router.post('/', auth, upload.array('media', 5), async (req, res) => {
    try {
        const { title, description, content, category, tags } = req.body;

        const media = req.files ? req.files.map(file => {
            let type = 'document';
            if (file.mimetype.startsWith('image/')) type = 'image';
            else if (file.mimetype.startsWith('video/')) type = 'video';

            return {
                type,
                url: `/uploads/${file.filename}`,
                filename: file.filename
            };
        }) : [];

        const post = new Post({
            title,
            description,
            content,
            category,
            tags: tags ? JSON.parse(tags) : [],
            media,
            author: req.userId
        });

        await post.save();
        await post.populate('author', 'username profilePicture');

        res.status(201).json({ post });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update post
router.put('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        Object.assign(post, req.body);
        await post.save();

        res.json({ post });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(req.userId);

        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(req.userId);
        }

        await post.save();
        res.json({ post, liked: likeIndex === -1 });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Search posts
router.get('/search/query', async (req, res) => {
    try {
        const { q, category } = req.query;
        const query = {};

        if (q) {
            query.$text = { $search: q };
        }

        if (category) {
            query.category = category;
        }

        const posts = await Post.find(query)
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 });

        res.json({ posts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;