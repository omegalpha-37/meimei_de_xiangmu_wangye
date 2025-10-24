// 暂时禁用文件存储，使用内存存储（仅用于演示）
let comments = [];

// 在 routes/comments.js 中修改
function readComments() {
    return comments; // 使用内存存储
}

function writeComments(newComments) {
    comments = newComments;
    return true;
}