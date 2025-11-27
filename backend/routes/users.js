const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get user profile
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.find({ author: user._id })
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 });

        res.json({ user, posts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { bio } = req.body;
        
        const user = await User.findById(req.userId);
        if (bio !== undefined) user.bio = bio;

        await user.save();

        res.json({ user: { id: user._id, username: user.username, bio: user.bio } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.userId);
        user.profilePicture = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ profilePicture: user.profilePicture });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Bookmark post
router.post('/bookmark/:postId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const postId = req.params.postId;

        const bookmarkIndex = user.bookmarks.indexOf(postId);

        if (bookmarkIndex > -1) {
            user.bookmarks.splice(bookmarkIndex, 1);
        } else {
            user.bookmarks.push(postId);
        }

        await user.save();
        res.json({ bookmarked: bookmarkIndex === -1 });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get bookmarks
router.get('/bookmarks/all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'bookmarks',
            populate: { path: 'author', select: 'username profilePicture' }
        });

        res.json({ bookmarks: user.bookmarks });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;