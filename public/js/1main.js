document.addEventListener('DOMContentLoaded', function() {
    let homeScrollPosition = 0;
    
    // 认证系统类
    class Auth {
        constructor() {
            this.baseUrl = '/api/auth';
        }
        
        async checkTokenValidity() {
            try {
                const response = await fetch(`${this.baseUrl}/user`);
                const result = await response.json();
                return !!result.user;
            } catch (error) {
                console.log('Token验证失败:', error);
                this.logout();
                return false;
            }
        }
        
        async register(email, password) {
            try {
                const response = await fetch(`${this.baseUrl}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                return result.success 
                    ? { success: true, message: result.message }
                    : { success: false, error: result.error || result.message || '注册失败' };
            } catch (error) {
                console.error('注册请求失败:', error);
                return { success: false, error: '网络错误，请稍后重试' };
            }
        }
        
        async login(email, password) {
            try {
                const response = await fetch(`${this.baseUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (result.success) {
                    return { success: true, user: result.user };
                } else {
                    return { success: false, error: result.error || '登录失败' };
                }
            } catch (error) {
                return { success: false, error: '网络错误' };
            }
        }
        
        async logout() {
            try {
                await fetch(`${this.baseUrl}/logout`, { method: 'POST' });
            } finally {
                console.log('用户已退出登录');
            }
        }
        
        async getCurrentUser() {
            try {
                const response = await fetch(`${this.baseUrl}/user`);
                const result = await response.json();
                if (result.user) {
                    return { success: true, user: result.user };
                } else {
                    return { success: false, user: null };
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
                return { success: false, user: null };
            }
        }

        getToken() {
            return null; // 使用 httpOnly Cookie
        }
        
        isLoggedIn() {
            return !!this.getToken();
        }
    }

    // 评论系统类
    class CommentSystem {
        constructor() {
            this.baseUrl = '/api/comments';
        }
        
        async submitComment(content) {
            try {
                const response = await fetch(`${this.baseUrl}/postcomments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: content })
                });
                return await response.json();
            } catch (error) {
                console.error('提交评论失败:', error);
                return { success: false, message: '网络错误，请稍后重试' };
            }
        }
        
        async getComments(limit = 50) {
            try {
                const response = await fetch(`${this.baseUrl}/latest?limit=${limit}`);
                return await response.json();
            } catch (error) {
                console.error('获取评论失败:', error);
                return { success: false, data: [] };
            }
        }
        
        renderComments(comments, container) {
            if (!comments || !comments.length) {
                container.innerHTML = '<div class="no-comments">暂无评论</div>';
                return;
            }
    
            container.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(comment.user_email || comment.userName || comment.userEmail)}</span>
                        <span class="comment-time">${new Date(comment.timestamp || comment.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                </div>
            `).join('');
        }
        
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
        
        filterPlantsByCategory(category) {
            return category === 'all' 
                ? this.plants 
                : this.plants.filter(plant => plant.category === category);
        }
        
        searchPlants(keyword) {
            const lowerKeyword = keyword.toLowerCase();
            return this.plants.filter(plant => 
                plant.name.toLowerCase().includes(lowerKeyword) ||
                plant.description.toLowerCase().includes(lowerKeyword) ||
                plant.category.toLowerCase().includes(lowerKeyword)
            );
        }
        
        renderPlantCards(plants, container) {
            if (!plants || !plants.length) {
                container.innerHTML = '<div class="no-plants">暂无植物数据</div>';
                return;
            }
            
            container.innerHTML = plants.map(plant => `
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
        }
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // 页面管理类 (合并两个文件的特性)
    class PageManager {
        constructor() {
            this.pageOrder = [
                'home', 'products', 'applications', 'contact', 
                'feedback-form', 'plant-library', 'plant-combinations',
                'login-page', 'register-page','value-added'
            ];
            this.currentPageIndex = 0;
            this.sections = document.querySelectorAll('.page-section');
            this.navButtons = document.querySelectorAll('.nav-btn');
            this.auth = new Auth();
            this.commentSystem = new CommentSystem();
            this.plantManager = new PlantManager();
            
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.showSection('home', 'none');
            this.updateAuthStatus();
            this.loadComments();
        }
        
        bindEvents() {
            // 导航按钮事件
            this.navButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetId = button.getAttribute('data-target');
                    const targetIndex = this.pageOrder.indexOf(targetId);
                    let direction = 'none';
                    
                    if (targetIndex > this.currentPageIndex) {
                        direction = 'left';
                    } else if (targetIndex < this.currentPageIndex) {
                        direction = 'right';
                    }
                    
                    this.showSection(targetId, direction);
                });
            });
            
            // 卡片点击事件
            const horizontalCards = document.querySelectorAll('.horizontal-card');
            horizontalCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = card.getAttribute('data-target');
                    if (targetId) {
                        this.showSection(targetId, 'left');
                    }
                });
            });
            
            // 植物图鉴按钮
            document.querySelector('.plant-library-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('plant-library', 'left');
            });
            
            // 植物组合按钮
            document.querySelector('.plant-combinations-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('plant-combinations', 'left');
            });
            
            // 返回首页按钮
            document.querySelectorAll('.back-to-home-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSection('home', 'right');
                });
            });
            
            // 增值服务按钮
            document.querySelector('.horizontal-card:nth-child(3) .btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('value-added', 'left');
            });
            
            // 留言反馈按钮
            document.querySelector('.feedback-btn')?.addEventListener('click', () => {
                this.showSection('feedback-form', 'left');
            });
            
            // 登录/注册切换
            document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('register-page', 'left');
            });
            
            document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('login-page', 'right');
            });
            
            // 登录按钮
            document.querySelector('.login-btn')?.addEventListener('click', () => {
                this.showSection('login-page', 'left');
            });
            
            // 植物分类筛选
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.filterPlants(btn.getAttribute('data-category'));
                });
            });
            
            // 搜索功能
            const searchBtn = document.querySelector('.search-bar button');
            const searchInput = document.querySelector('.search-bar input');
            
            if (searchBtn && searchInput) {
                searchBtn.addEventListener('click', () => this.performSearch());
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.performSearch();
                });
            }
            
            // 表单提交事件
            this.bindFormEvents();
        }
        
        bindFormEvents() {
            // 留言表单
            const messageForm = document.getElementById('messageForm');
            if (messageForm) {
                messageForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = {
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        message: document.getElementById('message').value,
                        timestamp: new Date().toISOString()
                    };
                    this.submitFeedback(formData);
                });
            }
            
            // 评论表单
            const commentForm = document.getElementById('commentForm');
            if (commentForm) {
                commentForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const content = document.getElementById('comment').value.trim();
                    
                    if (!content) {
                        alert('请输入评论内容');
                        return;
                    }
                    
                    const result = await this.commentSystem.submitComment(content);
                    if (result.success) {
                        alert('评论发表成功！');
                        commentForm.reset();
                        document.getElementById('charCount').textContent = '0';
                        this.loadComments();
                    } else {
                        alert('发表失败：' + result.message);
                    }
                });
                
                // 字符计数
                const commentTextarea = document.getElementById('comment');
                const charCount = document.getElementById('charCount');
                if (commentTextarea && charCount) {
                    commentTextarea.addEventListener('input', () => {
                        charCount.textContent = commentTextarea.value.length;
                    });
                }
            }
            
            // 登录表单
            document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                const result = await this.auth.login(email, password);
                if (result.success) {
                    alert('登录成功！');
                    this.updateAuthStatus();
                    this.showSection('feedback-form', 'left');
                } else {
                    alert('登录失败：' + result.error);
                }
            });
            
            // 注册表单
            document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                
                const result = await this.auth.register(email, password);
                if (result.success) {
                    alert('注册成功，请登录！');
                    this.showSection('login-page', 'right');
                } else {
                    alert('注册失败：' + result.error);
                }
            });
        }
        
        showSection(sectionId, direction) {
            console.log('切换到页面:', sectionId);
            
            // 首页滚动位置处理
            if (document.getElementById('home').classList.contains('active') && sectionId !== 'home') {
                homeScrollPosition = window.scrollY || document.documentElement.scrollTop;
                console.log('保存首页位置:', homeScrollPosition);
            }
            
            // 返回首页时恢复滚动位置
            if (sectionId === 'home' && homeScrollPosition > 0) {
                window.scrollTo({
                    top: homeScrollPosition,
                    behavior: 'instant'
                });
                console.log('恢复首页位置:', homeScrollPosition);
            }
            
            // 隐藏所有页面
            this.sections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active', 'slide-left', 'slide-right');
            });
            
            // 显示目标页面
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // 添加动画
                if (direction === 'left') {
                    targetSection.classList.add('slide-left');
                } else if (direction === 'right') {
                    targetSection.classList.add('slide-right');
                }
                
                setTimeout(() => {
                    targetSection.classList.add('active');
                    
                    // 全屏页面滚动到顶部
                    if (targetSection.classList.contains('fullscreen-page')) {
                        window.scrollTo(0, 0);
                    }
                }, 50);
            }
            
            // 更新导航按钮状态
            this.navButtons.forEach(button => {
                button.classList.remove('active');
                if (button.getAttribute('data-target') === sectionId) {
                    button.classList.add('active');
                }
            });
            
            // 更新当前页面索引
            this.currentPageIndex = this.pageOrder.indexOf(sectionId);
            
            // 页面特定处理
            if (sectionId === 'home') {
                this.loadLatestFeedback();
            }
            
            // 特殊页面样式处理
            if (sectionId === 'plant-library' || sectionId === 'plant-combinations') {
                document.body.classList.add('plant-library-active');
                document.body.classList.remove('value-added-active');
            } else if (sectionId === 'value-added') {
                document.body.classList.add('value-added-active');
                document.body.classList.remove('plant-library-active');
            } else {
                document.body.classList.remove('plant-library-active');
                document.body.classList.remove('value-added-active');
            }
            
            // 评论页面处理
            if (sectionId === 'feedback-form') {
                setTimeout(() => {
                    this.updateAuthStatus();
                    this.loadComments();
                }, 100);
            }
        }
        
        async updateAuthStatus() {
            const result = await this.auth.getCurrentUser();
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
                        await this.auth.logout();
                        this.updateAuthStatus();
                        this.loadComments();
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
                        this.showSection('login-page', 'left');
                    });
                }
                
                if (submitCommentBtn) {
                    submitCommentBtn.disabled = true;
                    submitCommentBtn.textContent = '请先登录';
                }
            }
        }
        
        async loadComments() {
            try {
                const result = await this.commentSystem.getComments();
                const commentsContainer = document.querySelector('.comments-container');
                
                if (commentsContainer) {
                    if (result.success && result.data && result.data.length > 0) {
                        this.commentSystem.renderComments(result.data, commentsContainer);
                    } else if (Array.isArray(result) && result.length > 0) {
                        this.commentSystem.renderComments(result, commentsContainer);
                    } else {
                        commentsContainer.innerHTML = '<div class="no-comments">暂无评论，快来发表第一条吧！</div>';
                    }
                }
            } catch (error) {
                console.error('加载评论失败:', error);
                const commentsContainer = document.querySelector('.comments-container');
                if (commentsContainer) {
                    commentsContainer.innerHTML = '<div class="error-message">加载评论失败，请稍后重试</div>';
                }
            }
        }
        
        loadLatestFeedback() {
            const feedbackCards = document.querySelectorAll('.feedback-card');
            feedbackCards.forEach(card => {
                const randomRating = Math.floor(Math.random() * 2) + 4;
                const randomComments = Math.floor(Math.random() * 100) + 20;
                
                const ratingElement = card.querySelector('.rating');
                const commentsElement = card.querySelector('.comments');
                
                if (ratingElement) {
                    ratingElement.textContent = '★'.repeat(randomRating) + '☆'.repeat(5 - randomRating);
                }
                if (commentsElement) {
                    commentsElement.textContent = `${randomComments} 条评论`;
                }
            });
        }
        
        submitFeedback(formData) {
            console.log('提交反馈:', formData);
            alert('感谢您的反馈！我们会尽快处理。');
            document.getElementById('messageForm').reset();
            this.showSection('home', 'right');
        }
        
        filterPlants(category) {
            const plantCards = document.querySelectorAll('.plant-card');
            plantCards.forEach(card => {
                card.style.display = category === 'all' || card.getAttribute('data-category') === category 
                    ? 'block' 
                    : 'none';
            });
        }
        
        performSearch() {
            const searchInput = document.querySelector('.search-bar input');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm) {
                if (this.pageOrder[this.currentPageIndex] === 'plant-library') {
                    const filteredPlants = this.plantManager.searchPlants(searchTerm);
                    const container = document.querySelector('#plant-library .plants-grid');
                    if (container) {
                        this.plantManager.renderPlantCards(filteredPlants, container);
                    }
                } else {
                    alert(`搜索: ${searchTerm}`);
                }
                searchInput.value = '';
            }
        }
    }

    // 初始化应用
    const pageManager = new PageManager();
});