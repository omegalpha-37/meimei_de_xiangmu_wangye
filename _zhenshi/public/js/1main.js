        document.addEventListener('DOMContentLoaded', function() {
            // 获取所有页面区块和导航按钮
            const sections = document.querySelectorAll('.page-section');
            const navButtons = document.querySelectorAll('.nav-btn');
            const API_BASE = 'https://你的项目.vercel.app/api';
            // 定义页面顺序
            const pageOrder = ['home', 'products', 'applications', 'contact', 'feedback-form'];
            let currentPageIndex = 0;
            
            // 显示指定页面
            function showSection(sectionId, direction) {
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
            
            // 为留言反馈按钮添加点击事件
            document.querySelector('.feedback-btn').addEventListener('click', function() {
                showSection('feedback-form', 'left');
            });
            
            // 表单提交处理
            document.getElementById('messageForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const feedbackData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    message: formData.get('message'),
                    timestamp: new Date().toISOString()
                };
                
                try {
                    // 提交反馈到后端
                    const response = await fetch('/api/feedback', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(feedbackData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('感谢您的留言！我们会尽快与您联系。');
                        this.reset();
                        // 刷新首页的最新反馈
                        loadLatestFeedback();
                        // 返回联系我们页面
                        showSection('contact', 'right');
                    } else {
                        alert('提交失败：' + result.error);
                    }
                } catch (error) {
                    alert('网络错误，请重试');
                    console.error('提交反馈错误:', error);
                }
            });
            
            // 加载最新反馈
            async function loadLatestFeedback() {
                try {
                    //const response = await fetch('/api/feedback/latest');
                    const response = await fetch(`${API_BASE}/comments/latest?limit=3`);
                    const feedbacks = await response.json();
                    
                    const feedbackContainer = document.getElementById('latestFeedback');
                    
                    if (feedbacks.length === 0) {
                        feedbackContainer.innerHTML = `
                            <div class="feedback-card">
                                <p>暂无客户反馈</p>
                            </div>
                        `;
                    } else {
                        feedbackContainer.innerHTML = feedbacks.map(feedback => `
                            <div class="feedback-card">
                                <div class="comment-item">
                                    <div class="comment-header">
                                        <span class="comment-author">${feedback.name}</span>
                                        <span class="comment-time">${new Date(feedback.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div class="comment-content">${feedback.message}</div>
                                </div>
                            </div>
                        `).join('');
                    }
                } catch (error) {
                    console.error('加载反馈失败:', error);
                    document.getElementById('latestFeedback').innerHTML = `
                        <div class="feedback-card">
                            <p>加载反馈失败</p>
                        </div>
                    `;
                }
            }
            
            // 页面加载时显示最新反馈
            window.onload = function() {
                loadLatestFeedback();
            };
            
            // 默认显示首页
            showSection('home', 'none');
        });