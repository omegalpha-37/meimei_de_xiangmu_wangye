document.addEventListener('DOMContentLoaded', function() {
    let homeScrollPosition = 0;
    
    // 右侧边栏功能
const rightSidebar = document.querySelector('.right-sidebar');
const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');

// 切换边栏显示/隐藏
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function() {
        rightSidebar.classList.toggle('expanded');
        
        if (rightSidebar.classList.contains('expanded')) {
            rightSidebar.style.right = '0';
            rightSidebar.style.width = '200px';
        } else {
            rightSidebar.style.right = '-30px';
            rightSidebar.style.width = '80px';
        }
    });
}

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

    // 全局背景切换效果//附加产品应用页面的目录隐藏浮现
    const darkBg = document.querySelector('.dark-bg');
    const muluye = document.querySelector('.applications-sidebar')
    // 监听页面滚动事件
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const markerPosition = 150;
        let opacity;
        let mulu_opacity;
        let mulu_pointer;
        if (scrollY < markerPosition) {
            opacity = 1;
            mulu_opacity=0;
            mulu_pointer='none';
        } else if (scrollY > markerPosition + 200) {
            opacity = 0;
            mulu_opacity=1;
            mulu_opacity='auto';
        } else {
            opacity = 1 - (scrollY - markerPosition) / 200;
            mulu_opacity=(scrollY - markerPosition) / 200;
            mulu_pointer='auto';
        }
        darkBg.style.opacity = opacity;
        muluye.style.opacity=mulu_opacity;
        muluye.style.pointerEvents=mulu_pointer;
    });

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
            /*这是什么？ */
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

            // 添加到main.js的bindEvents方法中
            // 服务套餐容器控制
            document.querySelector('.view-packages-btn')?.addEventListener('click', () => {
                const container = document.querySelector('.service-package-container');
                const header = document.querySelector('header');
                const nav = document.querySelector('nav');
    
                if (container) {
                    container.classList.add('active');
                    // 隐藏头部和导航栏
                    if (header) header.style.display = 'none';
                    if (nav) nav.style.display = 'none';
                    // 阻止页面滚动
                    document.body.style.overflow = 'hidden';
                }   
            });

            // 由安装服务卡链接至应用服务页面
            // 注意！！！！需要调整在手机端的显示，会弹出服务套餐详情页面；！！！！！
            // ！！！服务套餐详情页面有bug！！！looklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklooklook
            document.getElementById('installation-service-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('applications', 'left');
                // 添加滚动逻辑
                setTimeout(() => {
                const applicationsSection = document.getElementById('applications');
                    if (applicationsSection) {
                        const scrollPosition = applicationsSection.offsetTop - 50;
                        window.scrollTo({
                            top: scrollPosition,
                            behavior: 'smooth'
                        });
                    }
                }, 500); // 延迟500ms确保页面切换动画完成
            });

            // 关闭服务套餐容器
            document.querySelector('.close-package-btn')?.addEventListener('click', () => {
                const container = document.querySelector('.service-package-container');
                const header = document.querySelector('header');
                const nav = document.querySelector('nav');
                
                if (container) {
                    container.classList.remove('active');
                    // 显示头部和导航栏
                    if (header) header.style.display = '';
                    if (nav) nav.style.display = '';
                    // 恢复页面滚动
                    document.body.style.overflow = '';
                    this.showSection('value-added', 'right');
                }
            });

            //售后保障页面
            document.querySelector('.qwer-packages-btn')?.addEventListener('click', () => {
                const container = document.querySelector('.bz-packageee-container');
                const header = document.querySelector('header');
                const nav = document.querySelector('nav');
    
                if (container) {
                    container.classList.add('active');
                    // 隐藏头部和导航栏
                    if (header) header.style.display = 'none';
                    if (nav) nav.style.display = 'none';
                    // 阻止页面滚动
                    document.body.style.overflow = 'hidden';
                }   
            });

            // 关闭套餐容器
            document.querySelector('.close-packageee-btn')?.addEventListener('click', () => {
                const container = document.querySelector('.bz-packageee-container');
                const header = document.querySelector('header');
                const nav = document.querySelector('nav');
                
                if (container) {
                    container.classList.remove('active');
                    // 显示头部和导航栏
                    if (header) header.style.display = '';
                    if (nav) nav.style.display = '';
                    // 恢复页面滚动
                    document.body.style.overflow = '';
                    this.showSection('value-added', 'right');
                }
            });

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
            
            // 在首页卡片点击时保存当前位置
            const horizontalCards = document.querySelectorAll('.horizontal-card');
            horizontalCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 保存当前位置
                    homeScrollPosition = window.scrollY || document.documentElement.scrollTop;
                    console.log('点击卡片，保存首页位置:', homeScrollPosition);
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
            
            // 借用返回首页按钮的形式，免费咨询按钮取消自定义页面头部等元素
            document.querySelectorAll('.qwer-packages-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSection('home', 'right');
                    
                    // 在showSection完成后恢复位置
                    setTimeout(() => {
                        if (homeScrollPosition > 0) {
                            window.scrollTo({
                                top: homeScrollPosition,
                                behavior: 'smooth'
                            });
                            homeScrollPosition = 0; // 使用后重置
                        }
                    }, 200);
                });
            });

            document.querySelectorAll('.view-packages-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSection('home', 'right');
                    
                    // 在showSection完成后恢复位置
                    setTimeout(() => {
                        if (homeScrollPosition > 0) {
                            window.scrollTo({
                                top: homeScrollPosition,
                                behavior: 'smooth'
                            });
                            homeScrollPosition = 0; // 使用后重置
                        }
                    }, 200);
                });
            });

            
            // 套餐快速跳转功能
            document.querySelectorAll('.jump-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const targetId = button.getAttribute('data-target');
                    const targetElement = document.getElementById(targetId);
                
                    if (targetElement) {
                        // 平滑滚动到目标套餐
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
            
                        // 高亮显示目标套餐（3秒后移除高亮）
                        targetElement.classList.add('highlight');
                        setTimeout(() => {
                            targetElement.classList.remove('highlight');
                        }, 3000);
                    }
                });
            });

            // 返回首页按钮 - 使用保存的位置
            document.querySelectorAll('.back-to-home-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSection('home', 'right');
                    
                    // 在showSection完成后恢复位置
                    setTimeout(() => {
                        if (homeScrollPosition > 0) {
                            window.scrollTo({
                                top: homeScrollPosition,
                                behavior: 'smooth'
                            });
                            homeScrollPosition = 0; // 使用后重置
                        }
                    }, 200);
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

            // 关闭登录/注册悬浮弹窗
            document.querySelectorAll('.close-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                e.preventDefault();
                // 关闭时返回首页（可根据需求改为其他页面）
                this.showSection('home', 'right');
                });
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
			
			// 首页滚动位置处理 - 先保存当前位置
			if (document.getElementById('home').classList.contains('active') && sectionId !== 'home') {
				homeScrollPosition = window.scrollY || document.documentElement.scrollTop;
				console.log('保存首页位置:', homeScrollPosition);
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
				    
				    setTimeout(() => {
				        // 所有导航按钮点击都滚动到页面顶部
				        window.scrollTo({
				            top: 0,
				            behavior: 'smooth'
				        });
				    }, 100);
				    
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
                document.body.classList.remove('value-added-active', 'login-page-active', 'register-page-active');
            } else if (sectionId === 'value-added') {
                document.body.classList.add('value-added-active', 'login-page-active', 'register-page-active');
                document.body.classList.remove('plant-library-active');
            } else if (sectionId === 'login-page'){
                document.body.classList.add('login-page-active');
                document.body.classList.remove('plant-library-active', 'value-added-active', 'register-page-active');
            } else if(sectionId === 'register-page'){
                document.body.classList.add('register-page-active');
                document.body.classList.remove('plant-library-active', 'value-added-active', 'login-page-active');
            } else {
                document.body.classList.remove('plant-library-active', 'value-added-active', 'login-page-active', 'register-page-active');
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

    // 为产品应用页面目录添加平滑滚动效果
    function setupSmoothScrolling() {
        // 获取产品服务页面目录中的所有锚点链接
        const sidebarLinks = document.querySelectorAll('.applications-sidebar a[href^="#"]');
    
        // 为每个锚点链接添加点击事件监听器
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // 阻止默认的锚点跳转行为，避免直接跳动
                e.preventDefault();
            
                // 获取目标元素的ID
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                // 如果目标元素存在，则进行平滑滚动
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100, // 减去100px的偏移量，避免被顶部导航栏遮挡
                        behavior: 'smooth' // 平滑滚动效果
                    });
                
                    // 高亮当前选中的链接
                    sidebarLinks.forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                }   
            });
        });
    }

    // 为植物卡片添加全屏扩展功能
function setupPlantCardExpansion() {
    // 创建背景遮罩元素
    let overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    document.body.appendChild(overlay);
    
    // 为所有"查看详情"按钮添加点击事件
    const detailButtons = document.querySelectorAll('.plant-card .btn');
    detailButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const plantCard = this.closest('.plant-card');
            const isFullscreen = plantCard.classList.contains('fullscreen');
            
            if (!isFullscreen) {
                // 扩展到全屏前：显示详细描述
                const detailedDescription = plantCard.querySelector('.detailed-description');
                if (detailedDescription) detailedDescription.style.display = 'block';
                
                // 扩展到全屏
                plantCard.classList.add('fullscreen');
                overlay.classList.add('active');
                this.textContent = '还原';
                document.body.style.overflow = 'hidden'; // 防止背景滚动
                
                // 暂时禁用其他卡片的交互
                const otherCards = document.querySelectorAll('.plant-card:not(.fullscreen)');
                otherCards.forEach(card => {
                    card.style.opacity = '0.3';
                    card.style.pointerEvents = 'none';
                });
            } else {
                // 还原前：隐藏详细描述，显示简洁描述
                const detailedDescription = plantCard.querySelector('.detailed-description');
                if (detailedDescription) detailedDescription.style.display = 'none';
                
                // 还原到正常大小
                plantCard.classList.remove('fullscreen');
                overlay.classList.remove('active');
                this.textContent = '查看详情';
                document.body.style.overflow = '';
                
                // 恢复其他卡片的交互
                const otherCards = document.querySelectorAll('.plant-card');
                otherCards.forEach(card => {
                    card.style.opacity = '1';
                    card.style.pointerEvents = '';
                });
            }
        });
    });
    
    
    // 点击遮罩也可以关闭全屏卡片
    overlay.addEventListener('click', function() {
        const fullscreenCards = document.querySelectorAll('.plant-card.fullscreen');
        fullscreenCards.forEach(card => {
            const detailedDescription = card.querySelector('.detailed-description');
            if (detailedDescription) detailedDescription.style.display = 'none';
            
            // 还原卡片
            card.classList.remove('fullscreen');
            overlay.classList.remove('active');
            const btn = card.querySelector('.btn');
            if (btn) btn.textContent = '查看详情';
            document.body.style.overflow = '';
            
            // 恢复其他卡片的交互
            const otherCards = document.querySelectorAll('.plant-card');
            otherCards.forEach(c => {
                c.style.opacity = '1';
                c.style.pointerEvents = '';
            });
        });
    });
    
    // 添加ESC键关闭功能
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const fullscreenCards = document.querySelectorAll('.plant-card.fullscreen');
            if (fullscreenCards.length > 0) {
                fullscreenCards[0].querySelector('.btn').click();
            }
        }
    });
}

// 在页面加载完成后初始化植物卡片扩展功能
window.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('#plant-library')) {
        setupPlantCardExpansion();
    }
});

    // 当文档加载完成后执行
    window.addEventListener('DOMContentLoaded', setupSmoothScrolling);

    // 初始化应用
    const pageManager = new PageManager();
});