document.addEventListener('DOMContentLoaded', function() {
    // 获取所有页面区块和导航按钮
    const sections = document.querySelectorAll('.page-section');
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // 定义页面顺序（添加植物图鉴和认证页面）
    const pageOrder = [
        'home', 'products', 'applications', 'contact', 
        'feedback-form', 'plant-library', 'plant-combinations',
        'login-page', 'register-page','value-added'
    ];
    let currentPageIndex = 0;
    
    // 显示指定页面
    function showSection(sectionId, direction) {
        console.log('切换到页面:', sectionId);
        
        // 隐藏所有页面
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
            section.classList.remove('slide-left');
            section.classList.remove('slide-right');
        });
        
        // 显示目标页面
        const targetSection = document.getElementById(sectionId);
        if(targetSection) {
            targetSection.style.display = 'block';
            
            // 添加切换动画
            if (direction === 'left') {
                targetSection.classList.add('slide-left');
            } else if (direction === 'right') {
                targetSection.classList.add('slide-right');
            }
            
            setTimeout(() => {
                targetSection.classList.add('active');
            }, 50);
        }
        
        // 更新导航按钮的active状态
        navButtons.forEach(button => {
            button.classList.remove('active');
            if(button.getAttribute('data-target') === sectionId) {
                button.classList.add('active');
            }
        });
        
        // 更新当前页面索引
        currentPageIndex = pageOrder.indexOf(sectionId);
        
        // 如果是首页，加载最新反馈
        if (sectionId === 'home') {
            loadLatestFeedback();
        }
        
        // 处理特殊页面的显示
        if (sectionId === 'plant-library' || sectionId === 'plant-combinations') {
            document.body.classList.add('plant-library-active');
        } else {
            document.body.classList.remove('plant-library-active');
        }
        
        // 页面切换后的额外处理
        setTimeout(() => {
            // 如果是评论页面，更新认证状态和加载评论
            if (sectionId === 'feedback-form') {
                updateAuthStatus();
                loadComments();
            }
        }, 100);
    }
    
    
    // 为导航按钮添加点击事件
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetIndex = pageOrder.indexOf(targetId);
            
            // 判断切换方向
            let direction = 'none';
            if (targetIndex > currentPageIndex) {
                direction = 'left'; // 从右向左滑动
            } else if (targetIndex < currentPageIndex) {
                direction = 'right'; // 从左向右滑动
            }
            
            // 显示对应页面
            showSection(targetId, direction);
        });
    });
    
    // 植物图鉴按钮点击事件
    const plantLibraryBtn = document.querySelector('.plant-library-btn');
    if (plantLibraryBtn) {
        plantLibraryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('植物图鉴按钮被点击');
            
            // 直接切换到植物图鉴页面
            showSection('plant-library', 'left');
        });
    }
    
    // 返回首页按钮点击事件
    const backToHomeBtns = document.querySelectorAll('.back-to-home-btn');
    backToHomeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('返回首页按钮被点击');
            
            // 返回首页
            showSection('home', 'right');
        });
    });
	
	// 植物组合
	const plantCombinationsBtn = document.querySelector('.plant-combinations-btn');
	if (plantCombinationsBtn) {
	    plantCombinationsBtn.addEventListener('click', function(e) {
	        e.preventDefault();
	        showSection('plant-combinations', 'left');
	    });
	}
	
	// 首页增值服务卡片按钮点击事件
	const valueServiceBtn = document.querySelector('.horizontal-card:nth-child(3) .btn');
	if (valueServiceBtn) {
	    valueServiceBtn.addEventListener('click', function(e) {
	        e.preventDefault();
	        console.log('首页增值服务按钮被点击');
	        
	        // 切换到增值服务页面
	        showSection('value-added', 'left');
	    });
	}
    
    // 留言反馈按钮
    const feedbackBtn = document.querySelector('.feedback-btn');
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function() {
            showSection('feedback-form', 'left');
        });
    }
    
    // 留言表单提交
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                timestamp: new Date().toISOString()
            };
            
            submitFeedback(formData);
        });
    }

    // 认证相关功能
    // 初始化 Auth 实例（来自 app.js）
    const auth = new Auth();

    // 登录按钮点击跳转
    document.querySelector('.login-btn')?.addEventListener('click', () => {
        showSection('login-page', 'left');
    });

    // 登录/注册页面切换
    document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('register-page', 'left');
    });
    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('login-page', 'right');
    });

    // 注册表单提交
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        const result = await auth.register(email, password);
        if (result.success) {
            alert('注册成功，请登录！');
            showSection('login-page', 'right'); // 注册后跳转到登录页
        } else {
            alert('注册失败：' + result.error);
        }
    });
    
    // 更新认证状态显示函数
    function updateAuthStatus() {
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
                    
                    // 添加退出登录事件
                    document.getElementById('logoutLink')?.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await auth.logout();
                        updateAuthStatus();
                        loadComments();
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
                    
                    // 添加登录链接事件
                    document.querySelector('.login-link')?.addEventListener('click', (e) => {
                        e.preventDefault();
                        showSection('login-page', 'left');
                    });
                }
                
                if (submitCommentBtn) {
                    submitCommentBtn.disabled = true;
                    submitCommentBtn.textContent = '请先登录';
                }
            }
        }).catch(error => {
            console.error('获取用户状态失败:', error);
        });
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

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('请先登录');
                    showSection('login-page', 'left');
                    return;
                }

                const response = await fetch('/api/comments/postcomments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        content: content,
                        timestamp: new Date().toISOString()
                    }),
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    alert('评论发表成功！');
                    commentForm.reset();
                    document.getElementById('charCount').textContent = '0';
                    loadComments();
                } else {
                    alert('发表失败：' + result.message);
                }
            } catch (error) {
                console.error('提交评论失败:', error);
                alert('提交失败，请检查网络连接后重试');
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
    
    // 加载评论函数
    async function loadComments() {
        try {
            const response = await fetch('/api/comments/allcomments?limit=50');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            const commentsContainer = document.querySelector('.comments-container');
            
            if (commentsContainer) {
                if (result.success && result.data && result.data.length > 0) {
                    commentsContainer.innerHTML = result.data.map(comment => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-author">${escapeHtml(comment.userName || comment.userEmail)}</span>
                                <span class="comment-time">${new Date(comment.timestamp).toLocaleString('zh-CN')}</span>
                            </div>
                            <div class="comment-content">${escapeHtml(comment.content)}</div>
                        </div>
                    `).join('');
                } else if (Array.isArray(result) && result.length > 0) {
                    // 处理数组格式的响应
                    commentsContainer.innerHTML = result.map(comment => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-author">${escapeHtml(comment.userName || comment.userEmail)}</span>
                                <span class="comment-time">${new Date(comment.timestamp).toLocaleString('zh-CN')}</span>
                            </div>
                            <div class="comment-content">${escapeHtml(comment.content)}</div>
                        </div>
                    `).join('');
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
    
    // HTML转义函数
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 登录成功回调
    function onLoginSuccess() {
        updateAuthStatus();
        loadComments();
    }
    
    // 初始化显示首页
    showSection('home', 'none');
    
    // 初始化认证状态
    updateAuthStatus();
    
    // 初始化加载评论
    loadComments();
    
    // 模拟加载最新反馈
    function loadLatestFeedback() {
        const feedbackCards = document.querySelectorAll('.feedback-card');
        feedbackCards.forEach(card => {
            const randomRating = Math.floor(Math.random() * 2) + 4; // 4-5星
            const randomComments = Math.floor(Math.random() * 100) + 20; // 20-119条评论
            
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
    
    // 提交反馈函数
    function submitFeedback(formData) {
        // 这里应该发送到后端API
        console.log('提交反馈:', formData);
        
        // 模拟成功提交
        alert('感谢您的反馈！我们会尽快处理。');
        document.getElementById('messageForm').reset();
        
        // 返回首页
        showSection('home', 'right');
    }
    
    // 植物分类筛选功能
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除其他按钮的active状态
            categoryButtons.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的active状态
            this.classList.add('active');
            
            // 这里可以添加筛选逻辑
            const category = this.getAttribute('data-category');
            filterPlants(category);
        });
    });
    
    // 植物筛选函数
    function filterPlants(category) {
        const plantCards = document.querySelectorAll('.plant-card');
        plantCards.forEach(card => {
            if (category === 'all') {
                card.style.display = 'block';
            } else {
                const plantCategory = card.getAttribute('data-category');
                if (plantCategory === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }
    
    // 搜索功能
    const searchBtn = document.querySelector('.search-bar button');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchInput = document.querySelector('.search-bar input');
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // 这里可以添加搜索逻辑
                alert(`搜索: ${searchTerm}`);
                searchInput.value = '';
            }
        });
        
        // 支持回车键搜索
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        }
    }
    
    // 页面加载时显示首页
    showSection('home', 'none');
    
    // 初始化认证状态
    updateAuthStatus();
    
    // 初始化加载评论
    loadComments();
});