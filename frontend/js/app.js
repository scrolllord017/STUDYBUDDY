// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    loadPosts();

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPosts();
        }
    });
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shifted');
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('hidden');
}

function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const pageMap = {
        'home': 'homePage',
        'login': 'loginPage',
        'register': 'registerPage',
        'create': 'createPage',
        'postDetail': 'postDetailPage',
        'library': 'libraryPage',
        'profile': 'profilePage'
    };

    const pageId = pageMap[pageName];
    if (pageId) {
        document.getElementById(pageId).classList.add('active');

        if (pageName === 'library') {
            loadLibrary();
        } else if (pageName === 'profile') {
            loadUserProfile();
        } else if (pageName === 'home') {
            if (allPosts.length === 0) {
                loadPosts();
            }
        } else if (pageName === 'create') {
            if (!requireAuth()) return;
        }
    }

    const menu = document.getElementById('profileMenu');
    menu.classList.add('hidden');
}

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('profileMenu');
    const profileIcon = document.querySelector('.profile-icon');
    
    if (!menu.contains(e.target) && e.target !== profileIcon) {
        menu.classList.add('hidden');
    }
});