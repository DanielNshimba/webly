document.addEventListener('DOMContentLoaded', () => {
    // --- State & Constants ---
    let articles = JSON.parse(localStorage.getItem('articles')) || [];
    let currentArticleId = null;
    const adminPassword = 'admin'; // Simple mock password

    // --- Sample Data Initialization ---
    if (articles.length === 0) {
        articles = [
            {
                id: Date.now(),
                title: "The Future of Digital News",
                author: "Sarah Jenkins",
                date: new Date().toLocaleDateString(),
                content: "In an era of rapid information, the way we consume news is evolving. Modern portals focus on clarity, aesthetics, and community engagement. This article explores how digital journalism is adapting to the needs of the 2024 audience...",
                views: 1,
                likes: 0,
                comments: []
            },
            {
                id: Date.now() + 1,
                title: "Purple: The Color of Creativity",
                author: "Marcus Vane",
                date: new Date().toLocaleDateString(),
                content: "Often associated with luxury and imagination, purple has a unique psychological impact. In web design, it can evoke a sense of premium quality and sophistication while remaining approachable...",
                views: 1,
                likes: 0,
                comments: []
            }
        ];
        saveArticles();
    }

    // --- Selectors ---
    const articlesGrid = document.getElementById('articlesGrid');
    const articleModal = document.getElementById('articleModal');
    const modalBody = document.getElementById('modalBody');
    const articleForm = document.getElementById('articleForm');
    const adminPanel = document.getElementById('adminPanel');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // --- Core Functions ---

    function saveArticles() {
        localStorage.setItem('articles', JSON.stringify(articles));
    }

    function renderArticles() {
        articlesGrid.innerHTML = '';
        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.innerHTML = `
                <div class="article-card-content">
                    <div class="article-meta">
                        <span>${article.author}</span>
                        <span>${article.date}</span>
                    </div>
                    <h3>${article.title}</h3>
                    <p class="article-excerpt">${article.content}</p>
                </div>
                <div class="article-card-footer">
                    <span>👁️ ${article.views} views</span>
                    <span>💬 ${article.comments.length} comments</span>
                </div>
                ${isAdmin() ? `
                    <div class="admin-actions" style="padding: 0 2rem 1.5rem">
                        <button onclick="event.stopPropagation(); editArticle(${article.id})" class="btn-outline" style="padding: 0.5rem 1rem; font-size: 0.8rem">Edit</button>
                        <button onclick="event.stopPropagation(); deleteArticle(${article.id})" class="btn-outline" style="padding: 0.5rem 1rem; font-size: 0.8rem; border-color: #ef4444; color: #ef4444">Delete</button>
                    </div>
                ` : ''}
            `;
            card.onclick = () => openArticle(article.id);
            articlesGrid.appendChild(card);
        });
    }

    function openArticle(id) {
        const article = articles.find(a => a.id === id);
        if (!article) return;

        currentArticleId = id;
        article.views++;
        saveArticles();
        renderArticles(); // Update views in background

        modalBody.innerHTML = `
            <div class="article-meta">
                <span>By ${article.author}</span>
                <span>${article.date}</span>
            </div>
            <h1>${article.title}</h1>
            <div class="article-text">${article.content}</div>
        `;

        document.getElementById('viewCount').textContent = article.views;
        document.getElementById('likeCount').textContent = article.likes;
        updateComments();

        articleModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function isAdmin() {
        return sessionStorage.getItem('isAdmin') === 'true';
    }

    // --- Interactions ---

    document.getElementById('likeBtn').onclick = () => {
        const article = articles.find(a => a.id === currentArticleId);
        article.likes++;
        document.getElementById('likeCount').textContent = article.likes;
        saveArticles();
    };

    document.getElementById('commentForm').onsubmit = (e) => {
        e.preventDefault();
        const author = document.getElementById('commentAuthor').value;
        const text = document.getElementById('commentText').value;
        const article = articles.find(a => a.id === currentArticleId);

        article.comments.push({
            author,
            text,
            date: new Date().toLocaleString()
        });

        saveArticles();
        updateComments();
        e.target.reset();
        renderArticles(); // Update comment count in background
    };

    function updateComments() {
        const article = articles.find(a => a.id === currentArticleId);
        const list = document.getElementById('commentsList');
        list.innerHTML = article.comments.map(c => `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">${c.author}</span>
                    <span class="comment-date">${c.date}</span>
                </div>
                <div class="comment-text">${c.text}</div>
            </div>
        `).join('');
    }

    // --- Modal Closing ---
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            articleModal.style.display = 'none';
            loginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            currentArticleId = null;
        };
    });

    window.onclick = (e) => {
        if (e.target == articleModal) articleModal.style.display = 'none', document.body.style.overflow = 'auto';
        if (e.target == loginModal) loginModal.style.display = 'none', document.body.style.overflow = 'auto';
    };

    // --- Admin Dashboard Logic ---

    adminLoginBtn.onclick = () => {
        if (isAdmin()) {
            toggleAdminView();
        } else {
            loginModal.style.display = 'block';
        }
    };

    loginForm.onsubmit = (e) => {
        e.preventDefault();
        if (document.getElementById('adminPassword').value === adminPassword) {
            sessionStorage.setItem('isAdmin', 'true');
            loginModal.style.display = 'none';
            toggleAdminView();
            renderArticles(); // Show edit/delete buttons
        } else {
            alert('Incorrect password');
        }
    };

    logoutBtn.onclick = () => {
        sessionStorage.removeItem('isAdmin');
        adminPanel.classList.add('hidden');
        renderArticles();
    };

    function toggleAdminView() {
        adminPanel.classList.toggle('hidden');
        if (!adminPanel.classList.contains('hidden')) {
            adminPanel.scrollIntoView({ behavior: 'smooth' });
        }
    }

    articleForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('editArticleId').value;
        const title = document.getElementById('articleTitle').value;
        const author = document.getElementById('articleAuthor').value;
        const content = document.getElementById('articleContent').value;

        if (id) {
            const index = articles.findIndex(a => a.id == id);
            articles[index] = { ...articles[index], title, author, content };
        } else {
            articles.unshift({
                id: Date.now(),
                title,
                author,
                content,
                date: new Date().toLocaleDateString(),
                views: 1,
                likes: 0,
                comments: []
            });
        }

        saveArticles();
        renderArticles();
        e.target.reset();
        document.getElementById('editArticleId').value = '';
        document.getElementById('cancelEdit').classList.add('hidden');
        document.getElementById('saveBtn').textContent = 'Publish Article';
        adminPanel.classList.add('hidden');
    };

    window.editArticle = (id) => {
        const article = articles.find(a => a.id === id);
        document.getElementById('editArticleId').value = article.id;
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleAuthor').value = article.author;
        document.getElementById('articleContent').value = article.content;
        document.getElementById('saveBtn').textContent = 'Update Article';
        document.getElementById('cancelEdit').classList.remove('hidden');
        adminPanel.classList.remove('hidden');
        adminPanel.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteArticle = (id) => {
        if (confirm('Are you sure you want to delete this article?')) {
            articles = articles.filter(a => a.id !== id);
            saveArticles();
            renderArticles();
        }
    };

    document.getElementById('cancelEdit').onclick = () => {
        articleForm.reset();
        document.getElementById('editArticleId').value = '';
        document.getElementById('cancelEdit').classList.add('hidden');
        document.getElementById('saveBtn').textContent = 'Publish Article';
    };

    // --- Init ---
    renderArticles();
});
