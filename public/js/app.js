// 评论功能前端逻辑
document.addEventListener('DOMContentLoaded', function() {
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