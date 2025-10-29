// 认证系统类
class Auth {
    constructor() {
        this.baseUrl = '/api/auth';
        this.tokenKey = 'authToken';
        this.userKey = 'userInfo';
        
        // 检查本地存储的token是否有效
        this.checkTokenValidity();
    }
    
    // 检查token有效性
    async checkTokenValidity() {
        const token = localStorage.getItem(this.tokenKey);
        if (token) {
            try {
                const response = await fetch(`${this.baseUrl}/verify-token`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Token invalid');
                }
                
                const result = await response.json();
                if (result.success) {
                    console.log('Token验证成功');
                    return true;
                }
            } catch (error) {
                console.log('Token验证失败:', error);
                this.logout();
                return false;
            }
        }
        return false;
    }
    
    // 注册
    async register(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return { success: true, message: result.message };
            } else {
                return { success: false, error: result.message || '注册失败' };
            }
        } catch (error) {
            console.error('注册请求失败:', error);
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }
    
    // 登录
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.token) {
                // 保存token和用户信息
                localStorage.setItem(this.tokenKey, result.token);
                if (result.user) {
                    localStorage.setItem(this.userKey, JSON.stringify(result.user));
                }
                return { success: true, user: result.user };
            } else {
                return { success: false, error: result.message || '登录失败' };
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }
    
    // 退出登录
    async logout() {
        try {
            const token = localStorage.getItem(this.tokenKey);
            if (token) {
                await fetch(`${this.baseUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('退出登录请求失败:', error);
        } finally {
            // 清除本地存储
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);
            console.log('用户已退出登录');
        }
    }
    
    // 获取当前用户
    async getCurrentUser() {
        const token = localStorage.getItem(this.tokenKey);
        const userInfo = localStorage.getItem(this.userKey);
        
        if (token && userInfo) {
            try {
                // 验证token是否仍然有效
                const isValid = await this.checkTokenValidity();
                if (isValid) {
                    return { 
                        success: true, 
                        user: JSON.parse(userInfo),
                        token: token
                    };
                } else {
                    this.logout();
                    return { success: false, user: null };
                }
            } catch (error) {
                this.logout();
                return { success: false, user: null };
            }
        }
        return { success: false, user: null };
    }
    
    // 获取认证token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }
    
    // 检查是否已登录
    isLoggedIn() {
        return !!localStorage.getItem(this.tokenKey);
    }
}

// 评论系统类
class CommentSystem {
    constructor() {
        this.baseUrl = '/api/auth';
        this.auth = new Auth();
    }
    
    // 提交评论
    async submitComment(content) {
        try {
            const token = this.auth.getToken();
            if (!token) {
                return { success: false, message: '请先登录' };
            }
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: content,
                    timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('提交评论失败:', error);
            return { success: false, message: '网络错误，请稍后重试' };
        }
    }
    
    // 获取评论列表
    async getComments(limit = 50) {
        try {
            const response = await fetch(`${this.baseUrl}?limit=${limit}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('获取评论失败:', error);
            return { success: false, data: [] };
        }
    }
    
    // 渲染评论列表
    renderComments(comments, container) {
        if (!comments || !comments.length) {
            container.innerHTML = '<div class="no-comments">暂无评论</div>';
            return;
        }
        
        const commentsHtml = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHtml(comment.userName || comment.userEmail)}</span>
                    <span class="comment-time">${new Date(comment.timestamp).toLocaleString('zh-CN')}</span>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
            </div>
        `).join('');
        
        container.innerHTML = commentsHtml;
    }
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 植物数据管理类
class PlantManager {
    constructor() {
        this.plants = [];
        this.categories = ['all', 'indoor', 'outdoor', 'succulent', 'flowering'];
    }
    
    // 加载植物数据
    async loadPlants() {
        try {
            const response = await fetch('/api/plants');
            const result = await response.json();
            
            if (result.success) {
                this.plants = result.data;
                return this.plants;
            } else {
                console.error('加载植物数据失败:', result.message);
                return [];
            }
        } catch (error) {
            console.error('加载植物数据失败:', error);
            return [];
        }
    }
    
    // 根据分类筛选植物
    filterPlantsByCategory(category) {
        if (category === 'all') {
            return this.plants;
        }
        return this.plants.filter(plant => plant.category === category);
    }
    
    // 搜索植物
    searchPlants(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.plants.filter(plant => 
            plant.name.toLowerCase().includes(lowerKeyword) ||
            plant.description.toLowerCase().includes(lowerKeyword) ||
            plant.category.toLowerCase().includes(lowerKeyword)
        );
    }
    
    // 渲染植物卡片
    renderPlantCards(plants, container) {
        if (!plants || !plants.length) {
            container.innerHTML = '<div class="no-plants">暂无植物数据</div>';
            return;
        }
        
        const cardsHtml = plants.map(plant => `
            <div class="plant-card" data-category="${plant.category}">
                <div class="plant-image">
                    ${plant.image ? `<img src="${plant.image}" alt="${plant.name}" loading="lazy">` : '🌿'}
                </div>
                <h3>${this.escapeHtml(plant.name)}</h3>
                <p>${this.escapeHtml(plant.description)}</p>
                <div class="plant-meta">
                    <span class="category-tag">${this.escapeHtml(plant.category)}</span>
                    <span class="difficulty">难度: ${'★'.repeat(plant.difficulty)}</span>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = cardsHtml;
    }
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 提交反馈
    async submitFeedback(feedbackData) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('提交反馈失败:', error);
            return { success: false, message: '网络错误，请稍后重试' };
        }
    }
    
    // 获取最新反馈
    async getLatestFeedback(limit = 3) {
        try {
            const response = await fetch(`${this.baseUrl}?limit=${limit}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('获取反馈失败:', error);
            return { success: false, data: [] };
        }
    }
}

// 页面管理类
class PageManager {
    constructor() {
        this.currentPage = 'home';
        this.pages = ['home', 'products', 'applications', 'contact', 'feedback-form', 'plant-library', 'plant-combinations', 'login-page', 'register-page', 'value-added'];
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.showPage('home');
    }
    
    bindEvents() {
        // 导航按钮事件
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPage = e.target.getAttribute('data-target');
                if (targetPage && this.pages.includes(targetPage)) {
                    this.showPage(targetPage);
                }
            });
        });
        
        // 返回首页按钮
        document.querySelectorAll('.back-to-home-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('home');
            });
        });
        
        // 登录/注册切换
        document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('register-page');
        });
        
        document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('login-page');
        });
    }
    
    showPage(pageId, direction = 'left') {
        // 隐藏所有页面
        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active', 'slide-left', 'slide-right');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.style.display = 'block';
            
            // 添加动画
            if (direction === 'left') {
                targetPage.classList.add('slide-left');
            } else if (direction === 'right') {
                targetPage.classList.add('slide-right');
            }
            
            setTimeout(() => {
                targetPage.classList.add('active');
            }, 50);
            
            this.currentPage = pageId;
            
            // 更新导航按钮状态
            this.updateNavButtons(pageId);
            
            // 页面特定逻辑
            this.handlePageSpecificLogic(pageId);
        }
    }
    
    updateNavButtons(activePage) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-target') === activePage) {
                btn.classList.add('active');
            }
        });
    }
    
    handlePageSpecificLogic(pageId) {
        switch (pageId) {
            case 'plant-library':
                this.loadPlantLibrary();
                break;
            case 'feedback-form':
                this.loadFeedbackPage();
                break;
            case 'value-added':
                this.loadValueAddedPage();
                break;
        }
    }
    
    async loadPlantLibrary() {
        // 只绑定事件，不重新渲染内容
        this.bindCategoryFilters();
        
        // 确保静态植物卡片可见
        const plantCards = document.querySelectorAll('.plant-card');
        plantCards.forEach(card => {
            card.style.display = 'block';
        });
    }
    
    async loadFeedbackPage() {
        const commentSystem = new CommentSystem();
        const comments = await commentSystem.getComments();
        const container = document.querySelector('.comments-container');
        
        if (container && comments.success) {
            commentSystem.renderComments(comments.data, container);
        }
        
        // 更新认证状态
        this.updateAuthStatus();
    }
    
    async loadValueAddedPage() {
        // 加载增值服务页面数据
        console.log('加载增值服务页面');
    }
    
    updateFeedbackCards(feedbackData) {
        // 更新首页反馈卡片显示
        const cards = document.querySelectorAll('.feedback-card');
        cards.forEach((card, index) => {
            if (feedbackData[index]) {
                const feedback = feedbackData[index];
                const ratingElement = card.querySelector('.rating');
                const commentsElement = card.querySelector('.comments');
                
                if (ratingElement) {
                    ratingElement.textContent = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
                }
                if (commentsElement) {
                    commentsElement.textContent = `${feedback.commentCount} 条评论`;
                }
            }
        });
    }
    
    bindCategoryFilters() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                
                // 更新按钮状态
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // 筛选植物
                this.filterPlants(category);
            });
        });
    }
    
    filterPlants(category) {
        const plantCards = document.querySelectorAll('.plant-card');
        plantCards.forEach(card => {
            if (category === 'all') {
                card.style.display = 'block';
            } else {
                const plantCategory = card.getAttribute('data-category');
                card.style.display = plantCategory === category ? 'block' : 'none';
            }
        });
    }
    
    updateAuthStatus() {
        const auth = new Auth();
        auth.getCurrentUser().then(result => {
            const authStatusElement = document.getElementById('commentAuthStatus');
            const submitCommentBtn = document.getElementById('submitCommentBtn');
            
            if (result.user) {
                // 用户已登录
                if (authStatusElement) {
                    authStatusElement.innerHTML = `
                        <div style="background: #e9f4ec; color: #2d5e3b; padding: 10px; border-radius: 4px;">
                            当前用户: ${result.user.email} | <a href="#" id="logoutLink" style="color: #2d5e3b;">退出登录</a>
                        </div>
                    `;
                    
                    document.getElementById('logoutLink')?.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await auth.logout();
                        this.updateAuthStatus();
                        this.loadFeedbackPage();
                    });
                }
                
                if (submitCommentBtn) {
                    submitCommentBtn.disabled = false;
                    submitCommentBtn.textContent = '发表评论';
                }
            } else {
                // 用户未登录
                if (authStatusElement) {
                    authStatusElement.innerHTML = `
                        <div style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px;">
                            请先 <a href="#" class="login-link" style="color: #2d5e3b;">登录</a> 后发表评论
                        </div>
                    `;
                    
                    document.querySelector('.login-link')?.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showPage('login-page');
                    });
                }
                
                if (submitCommentBtn) {
                    submitCommentBtn.disabled = true;
                    submitCommentBtn.textContent = '请先登录';
                }
            }
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面管理器
    const pageManager = new PageManager();
    
    // 初始化认证系统
    const auth = new Auth();
    
    // 初始化评论系统
    const commentSystem = new CommentSystem();
    
    // 全局事件绑定
    bindGlobalEvents();
    
    function bindGlobalEvents() {
        // 搜索功能
        const searchBtn = document.querySelector('.search-bar button');
        const searchInput = document.querySelector('.search-bar input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
        
        // 植物图鉴按钮
        document.querySelector('.plant-library-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            pageManager.showPage('plant-library');
        });
        
        // 植物组合按钮
        document.querySelector('.plant-combinations-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            pageManager.showPage('plant-combinations');
        });
        
        // 增值服务按钮
        document.querySelector('.horizontal-card:nth-child(3) .btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            pageManager.showPage('value-added');
        });
    }
    
    function performSearch() {
        const searchInput = document.querySelector('.search-bar input');
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm) {
            // 根据当前页面执行不同的搜索
            if (pageManager.currentPage === 'plant-library') {
                searchPlants(searchTerm);
            } else {
                // 默认搜索行为
                alert(`搜索: ${searchTerm}`);
            }
            
            searchInput.value = '';
        }
    }
    
    function searchPlants(keyword) {
        const plantManager = new PlantManager();
        const filteredPlants = plantManager.searchPlants(keyword);
        const container = document.querySelector('#plant-library .plants-grid');
        
        if (container) {
            plantManager.renderPlantCards(filteredPlants, container);
        }
    }
    
    // 评论表单提交
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const content = document.getElementById('comment').value.trim();
            if (!content) {
                alert('请输入评论内容');
                return;
            }
            
            const result = await commentSystem.submitComment(content);
            if (result.success) {
                alert('评论发表成功！');
                commentForm.reset();
                document.getElementById('charCount').textContent = '0';
                pageManager.loadFeedbackPage();
            } else {
                alert('发表失败：' + result.message);
            }
        });
        
        // 字符计数
        const commentTextarea = document.getElementById('comment');
        const charCount = document.getElementById('charCount');
        if (commentTextarea && charCount) {
            commentTextarea.addEventListener('input', function() {
                charCount.textContent = this.value.length;
            });
        }
    }
    
    // 登录表单
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = await auth.login(email, password);
        if (result.success) {
            alert('登录成功！');
            pageManager.updateAuthStatus();
            pageManager.showPage('home');
        } else {
            alert('登录失败：' + result.error);
        }
    });
    
    // 注册表单
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        const result = await auth.register(email, password);
        if (result.success) {
            alert('注册成功，请登录！');
            pageManager.showPage('login-page');
        } else {
            alert('注册失败：' + result.error);
        }
    });
});