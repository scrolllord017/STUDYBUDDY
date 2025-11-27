let currentPage = 1;
let allPosts = [];
let currentPostId = null;

async function loadPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '<div class="loader">Loading posts...</div>';

    try {
        const response = await api.getPosts(currentPage, 10);
        allPosts = [...allPosts, ...response.posts];
        displayPosts(allPosts);
    } catch (error) {
        container.innerHTML = '<div class="error-msg">Failed to load posts</div>';
    }
}

function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="loader">No posts available</div>';
        return;
    }

    container.innerHTML = posts.map(post => createPostCard(post)).join('');
}

function createPostCard(post) {
    const author = post.author || {};
    const initials = author.username ? author.username.charAt(0).toUpperCase() : 'U';
    const likesCount = post.likes ? post.likes.length : 0;
    const commentsCount = post.comments ? post.comments.length : 0;
    const isLiked = currentUser && post.likes && post.likes.includes(currentUser.id);
    const date = new Date(post.createdAt).toLocaleDateString();

    return `
        <div class="post-card" onclick="viewPost('${post._id}')">
            <div class="post-header">
                <div class="post-avatar">${initials}</div>
                <div>
                    <div class="post-author">@${author.username || 'Anonymous'}</div>
                    <div class="post-date">${date}</div>
                </div>
            </div>

            <h3 class="post-title">${post.title}</h3>
            <span class="post-category">${post.category || 'Article'}</span>
            <p class="post-description">${post.description}</p>

            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}

            <div class="post-footer">
                <span class="post-date">${post.views || 0} views</span>
                <div class="post-actions" onclick="event.stopPropagation()">
                    <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post._id}')">
                        <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i> ${likesCount}
                    </button>
                    <button class="action-btn">
                        <i class="fa-regular fa-comment"></i> ${commentsCount}
                    </button>
                    <button class="action-btn" onclick="toggleBookmark('${post._id}')">
                        <i class="fa-regular fa-bookmark"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function viewPost(postId) {
    currentPostId = postId;
    
    try {
        const response = await api.getPost(postId);
        const post = response.post;
        
        const author = post.author || {};
        const initials = author.username ? author.username.charAt(0).toUpperCase() : 'U';
        const date = new Date(post.createdAt).toLocaleDateString();
        
        document.getElementById('postDetailContent').innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${initials}</div>
                <div>
                    <div class="post-author">@${author.username || 'Anonymous'}</div>
                    <div class="post-date">${date}</div>
                </div>
            </div>

            <h1 class="post-title">${post.title}</h1>
            <span class="post-category">${post.category || 'Article'}</span>

            ${post.media && post.media.length > 0 ? post.media.map(m => {
                if (m.type === 'image') {
                    return `<img src="${API_URL.replace('/api', '')}${m.url}" style="width:100%;border-radius:8px;margin:1rem 0;">`;
                } else if (m.type === 'video') {
                    return `<video controls style="width:100%;border-radius:8px;margin:1rem 0;">
                        <source src="${API_URL.replace('/api', '')}${m.url}">
                    </video>`;
                }
                return '';
            }).join('') : ''}

            <p class="post-description">${post.description}</p>
            ${post.content ? `<p style="margin-top:1rem;">${post.content}</p>` : ''}

            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        `;

        await loadComments(postId);
        showPage('postDetail');
    } catch (error) {
        alert('Failed to load post');
    }
}

async function handleCreatePost(event) {
    event.preventDefault();

    if (!requireAuth()) return;

    const title = document.getElementById('postTitle').value;
    const category = document.getElementById('postCategory').value;
    const description = document.getElementById('postDescription').value;
    const content = document.getElementById('postContent').value;
    const tagsInput = document.getElementById('postTags').value;
    const mediaFiles = document.getElementById('postMedia').files;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('content', content);
    
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    formData.append('tags', JSON.stringify(tags));

    for (let i = 0; i < mediaFiles.length; i++) {
        formData.append('media', mediaFiles[i]);
    }

    try {
        await api.createPost(formData);
        alert('Post created successfully!');
        document.getElementById('createPostForm').reset();
        showPage('home');
        allPosts = [];
        currentPage = 1;
        loadPosts();
    } catch (error) {
        alert(error.message || 'Failed to create post');
    }
}

async function toggleLike(postId) {
    if (!requireAuth()) return;

    try {
        await api.likePost(postId);
        allPosts = [];
        currentPage = 1;
        loadPosts();
    } catch (error) {
        alert('Failed to like post');
    }
}

async function toggleBookmark(postId) {
    if (!requireAuth()) return;

    try {
        await api.bookmarkPost(postId);
        alert('Bookmark updated');
    } catch (error) {
        alert('Failed to bookmark post');
    }
}

async function searchPosts() {
    const query = document.getElementById('searchInput').value;
    
    if (!query.trim()) {
        allPosts = [];
        currentPage = 1;
        loadPosts();
        return;
    }

    try {
        const response = await api.searchPosts(query);
        displayPosts(response.posts);
    } catch (error) {
        alert('Search failed');
    }
}

async function loadComments(postId) {
    const container = document.getElementById('commentsContainer');
    
    try {
        const response = await api.getComments(postId);
        const comments = response.comments;
        
        if (comments.length === 0) {
            container.innerHTML = '<p style="color:#777;">No comments yet</p>';
            return;
        }

        container.innerHTML = comments.map(comment => {
            const author = comment.author || {};
            const initials = author.username ? author.username.charAt(0).toUpperCase() : 'U';
            const time = new Date(comment.createdAt).toLocaleString();
            
            return `
                <div class="comment">
                    <div class="comment-avatar">${initials}</div>
                    <div class="comment-content">
                        <div class="comment-author">@${author.username || 'Anonymous'}</div>
                        <div class="comment-text">${comment.text}</div>
                        <div class="comment-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<p class="error-msg">Failed to load comments</p>';
    }
}

async function handleAddComment(event) {
    event.preventDefault();

    if (!requireAuth()) return;

    const text = document.getElementById('commentText').value;

    try {
        await api.createComment(currentPostId, text);
        document.getElementById('commentText').value = '';
        loadComments(currentPostId);
    } catch (error) {
        alert('Failed to add comment');
    }
}

async function loadLibrary() {
    if (!requireAuth()) return;

    const container = document.getElementById('bookmarksContainer');
    container.innerHTML = '<div class="loader">Loading bookmarks...</div>';

    try {
        const response = await api.getBookmarks();
        const bookmarks = response.bookmarks;

        if (bookmarks.length === 0) {
            container.innerHTML = '<div class="loader">No bookmarked posts yet</div>';
            return;
        }

        container.innerHTML = bookmarks.map(post => createPostCard(post)).join('');
    } catch (error) {
        container.innerHTML = '<div class="error-msg">Failed to load bookmarks</div>';
    }
}

async function loadUserProfile() {
    if (!requireAuth()) return;

    try {
        const response = await api.getMe();
        const user = response.user;

        document.getElementById('profileUsername').textContent = `@${user.username}`;
        document.getElementById('profileBio').value = user.bio || '';
        
        if (user.profilePicture) {
            document.getElementById('profilePic').src = API_URL.replace('/api', '') + user.profilePicture;
        }

        const userResponse = await api.getProfile(user.username);
        const posts = userResponse.posts;
        
        const container = document.getElementById('userPostsContainer');
        if (posts.length === 0) {
            container.innerHTML = '<p style="color:#777;">No posts yet</p>';
        } else {
            container.innerHTML = posts.map(post => createPostCard(post)).join('');
        }
    } catch (error) {
        alert('Failed to load profile');
    }
}

async function updateProfile() {
    if (!requireAuth()) return;

    const bio = document.getElementById('profileBio').value;

    try {
        await api.updateProfile({ bio });
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Failed to update profile');
    }
}

async function handleProfilePicUpload(event) {
    if (!requireAuth()) return;

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
        const response = await api.uploadProfilePicture(formData);
        document.getElementById('profilePic').src = API_URL.replace('/api', '') + response.profilePicture;
        alert('Profile picture updated!');
    } catch (error) {
        alert('Failed to upload profile picture');
    }
}