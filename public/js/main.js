document.addEventListener('DOMContentLoaded', function() {
    // 获取所有页面区块和导航按钮
    const sections = document.querySelectorAll('.page-section');
    const navButtons = document.querySelectorAll('.nav-btn');
    const API_BASE = 'https://你的项目.vercel.app/api';
    
    // 定义页面顺序（添加植物图鉴）
    const pageOrder = ['home', 'products', 'applications', 'contact', 'feedback-form', 'plant-library'];
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
        
        // 处理植物图鉴页面的特殊显示
        if (sectionId === 'plant-library') {
            document.body.classList.add('plant-library-active');
        } else {
            document.body.classList.remove('plant-library-active');
        }
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
    const backToHomeBtn = document.querySelector('.back-to-home-btn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('返回首页按钮被点击');
            
            // 返回首页
            showSection('home', 'right');
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
    
    // 加载最新反馈
    loadLatestFeedback();
    
    // 默认显示首页
    showSection('home', 'none');
});

// 加载最新反馈函数
async function loadLatestFeedback() {
    try {
        const response = await fetch('/api/comments/latest?limit=3');
        const result = await response.json();
        
        const feedbackContainer = document.getElementById('latestFeedback');
        
        if (result.success && result.data && result.data.length > 0) {
            let feedbackHTML = '';
            
            result.data.forEach(comment => {
                const date = new Date(comment.timestamp).toLocaleDateString('zh-CN');
                feedbackHTML += `
                    <div class="feedback-card">
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-author">${escapeHtml(comment.name)}</span>
                                <span class="comment-time">${date}</span>
                            </div>
                            <div class="comment-content">${escapeHtml(comment.message)}</div>
                        </div>
                    </div>
                `;
            });
            
            feedbackContainer.innerHTML = feedbackHTML;
        } else if (Array.isArray(result) && result.length > 0) {
            // 处理第二种API响应格式
            feedbackContainer.innerHTML = result.map(feedback => `
                <div class="feedback-card">
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-author">${escapeHtml(feedback.name)}</span>
                            <span class="comment-time">${new Date(feedback.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div class="comment-content">${escapeHtml(feedback.message)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            feedbackContainer.innerHTML = `
                <div class="feedback-card">
                    <p>暂无客户反馈，成为第一个留言的人吧！</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载反馈失败:', error);
        const feedbackContainer = document.getElementById('latestFeedback');
        feedbackContainer.innerHTML = `
            <div class="feedback-card">
                <p>加载反馈失败，请稍后重试</p>
            </div>
        `;
    }
}

// 提交反馈函数
async function submitFeedback(formData) {
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('留言提交成功！感谢您的反馈。');
            // 清空表单
            document.getElementById('messageForm').reset();
            
            // 返回首页
            document.querySelector('.nav-btn[data-target="home"]').click();
            
            // 重新加载最新反馈
            loadLatestFeedback();
        } else {
            alert('提交失败：' + result.message);
        }
    } catch (error) {
        console.error('提交反馈失败:', error);
        alert('提交失败，请检查网络连接后重试');
    }
}

// HTML转义函数，防止XSS攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}