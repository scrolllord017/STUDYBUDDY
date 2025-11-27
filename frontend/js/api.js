const API_URL = 'http://localhost:5000/api';

const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth
    async register(username, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
    },

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async getMe() {
        return this.request('/auth/me');
    },

    // Posts
    async getPosts(page = 1, limit = 10) {
        return this.request(`/posts?page=${page}&limit=${limit}`);
    },

    async getPost(id) {
        return this.request(`/posts/${id}`);
    },

    async createPost(formData) {
        return this.request('/posts', {
            method: 'POST',
            body: formData,
        });
    },

    async updatePost(id, data) {
        return this.request(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deletePost(id) {
        return this.request(`/posts/${id}`, {
            method: 'DELETE',
        });
    },

    async likePost(id) {
        return this.request(`/posts/${id}/like`, {
            method: 'POST',
        });
    },

    async searchPosts(query, category) {
        return this.request(`/posts/search/query?q=${query}&category=${category || ''}`);
    },

    // Users
    async getProfile(username) {
        return this.request(`/users/${username}`);
    },

    async updateProfile(data) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async uploadProfilePicture(formData) {
        return this.request('/users/profile/picture', {
            method: 'POST',
            body: formData,
        });
    },

    async bookmarkPost(postId) {
        return this.request(`/users/bookmark/${postId}`, {
            method: 'POST',
        });
    },

    async getBookmarks() {
        return this.request('/users/bookmarks/all');
    },

    // Comments
    async getComments(postId) {
        return this.request(`/comments/post/${postId}`);
    },

    async createComment(postId, text) {
        return this.request('/comments', {
            method: 'POST',
            body: JSON.stringify({ postId, text }),
        });
    },

    async deleteComment(id) {
        return this.request(`/comments/${id}`, {
            method: 'DELETE',
        });
    },

    async likeComment(id) {
        return this.request(`/comments/${id}/like`, {
            method: 'POST',
        });
    },
};