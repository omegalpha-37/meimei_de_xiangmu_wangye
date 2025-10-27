// 评论功能前端逻辑 + 认证功能逻辑
class Auth {
  // 登录
  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
	  credentials: 'include'
    });
    
    return await response.json();
  }

  // 注册
  async register(email, password) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
	  credentials: 'include'
    });
    
    return await response.json();
  }

  // 登出
  async logout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
	  credentials: 'include'
    });
    
    return await response.json();
  }

  // 获取当前用户
  async getCurrentUser() {
    const response = await fetch('/api/auth/user',{
		credentials: 'include'
	});
    return await response.json();
  }
}

// 使用示例
const auth = new Auth();

document.addEventListener('DOMContentLoaded', async function() {
  // 1. 处理认证相关逻辑
  const { user } = await auth.getCurrentUser();
  
  if (user) {
    // 用户已登录，更新UI
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('user-section').style.display = 'block';
    document.getElementById('user-email').textContent = user.email;
  }

  // 2. 处理评论相关逻辑
  const commentForm = document.getElementById('commentForm');
  const commentsContainer = document.getElementById('commentsContainer');
  
  // 加载评论
  loadComments();
  
  // 提交评论
  if (commentForm) {
    commentForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const content = document.getElementById('content').value;
      
      if (name && content) {
        await submitComment(name, content);
        commentForm.reset();
      }
    });
  }
});

async function loadComments() {
  try {
    const response = await fetch('/api/comments');
    const comments = await response.json();
    renderComments(comments);
  } catch (error) {
    console.error('加载评论失败:', error);
  }
}

async function submitComment(name, content) {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, content })
    });
    
    if (response.ok) {
      loadComments(); // 重新加载评论
    }
  } catch (error) {
    console.error('提交评论失败:', error);
  }
}

function renderComments(comments) {
  const container = document.getElementById('commentsContainer');
  if (!container) return;
  
  container.innerHTML = comments.map(comment => `
    <div class="comment">
      <strong>${comment.name}</strong>
      <p>${comment.content}</p>
      <small>${new Date(comment.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}