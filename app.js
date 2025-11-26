// Markdown parser (simple implementation)
function parseMarkdown(text) {
    // Code blocks
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Blockquotes
    text = text.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Lists
    text = text.replace(/^\- (.*$)/gim, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Paragraphs
    text = text.split('\n\n').map(para => {
        if (!para.match(/^<[^>]+>/)) {
            return '<p>' + para + '</p>';
        }
        return para;
    }).join('\n');
    
    return text;
}

// Extract metadata from markdown content
function extractMetadata(content) {
    const lines = content.split('\n');
    const metadata = {
        title: 'Untitled',
        date: new Date().toISOString().split('T')[0],
        content: content
    };
    
    // Check for title (first h1)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        metadata.title = titleMatch[1];
    }
    
    // Check for date in format YYYY-MM-DD
    const dateMatch = content.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (dateMatch) {
        metadata.date = dateMatch[1];
    }
    
    return metadata;
}

// Fetch list of post files from posts.json
async function fetchPostsList() {
    try {
        const response = await fetch('posts.json');
        if (!response.ok) {
            throw new Error('posts.json not found');
        }
        const data = await response.json();
        return data.posts || [];
    } catch (error) {
        console.error('Error loading posts.json:', error);
        return [];
    }
}

// Fetch and parse a single post
async function fetchPost(filename) {
    try {
        const response = await fetch(`posts/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        const content = await response.text();
        const metadata = extractMetadata(content);
        
        return {
            filename,
            ...metadata
        };
    } catch (error) {
        console.error(`Error loading post ${filename}:`, error);
        return null;
    }
}

// Display posts on the main page
async function displayPosts() {
    const container = document.getElementById('posts-container');
    
    try {
        const postFiles = await fetchPostsList();
        
        if (postFiles.length === 0) {
            container.innerHTML = '<div class="error">포스트가 없습니다. posts 폴더에 마크다운 파일을 추가하고 posts.json을 업데이트하세요.</div>';
            return;
        }
        
        // Fetch all posts
        const posts = await Promise.all(
            postFiles.map(filename => fetchPost(filename))
        );
        
        // Filter out failed loads and sort by date (newest first)
        const validPosts = posts
            .filter(post => post !== null)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (validPosts.length === 0) {
            container.innerHTML = '<div class="error">포스트를 불러올 수 없습니다.</div>';
            return;
        }
        
        // Display posts
        container.innerHTML = validPosts.map(post => {
            const preview = post.content
                .replace(/^#.*$/gm, '') // Remove headers
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
                .replace(/[*_`]/g, '') // Remove formatting
                .trim()
                .substring(0, 200) + '...';
            
            return `
                <article class="post-card" onclick="viewPost('${post.filename}')">
                    <h2>${post.title}</h2>
                    <div class="post-meta">📅 ${post.date}</div>
                    <div class="post-preview">${preview}</div>
                </article>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error displaying posts:', error);
        container.innerHTML = '<div class="error">포스트를 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// View a single post
async function viewPost(filename) {
    const container = document.getElementById('posts-container');
    container.innerHTML = '<div class="loading">포스트를 불러오는 중...</div>';
    
    try {
        const response = await fetch(`posts/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        
        const content = await response.text();
        const metadata = extractMetadata(content);
        const htmlContent = parseMarkdown(content);
        
        container.innerHTML = `
            <a href="#" class="back-link" onclick="event.preventDefault(); displayPosts();">← 목록으로</a>
            <article class="post-card">
                <h2>${metadata.title}</h2>
                <div class="post-meta">📅 ${metadata.date}</div>
                <div class="post-content">${htmlContent}</div>
            </article>
        `;
        
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Error viewing post:', error);
        container.innerHTML = `
            <div class="error">포스트를 불러올 수 없습니다.</div>
            <a href="#" class="back-link" onclick="event.preventDefault(); displayPosts();">← 목록으로</a>
        `;
    }
}

// Initialize the blog
document.addEventListener('DOMContentLoaded', () => {
    displayPosts();
});
