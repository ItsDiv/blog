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

// posts 폴더의 모든 .md 파일을 자동으로 감지
async function fetchPostsList() {
    console.log('🔍 posts 폴더의 모든 .md 파일 스캔 중...');
    
    const detectedPosts = [];
    const patterns = [];
    
    // 1. 모든 가능한 문자 조합 (a-z, 0-9, -, _)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
    
    // 단일 문자 (a.md, b.md, ...)
    for (let c of chars) {
        patterns.push(`${c}.md`);
    }
    
    // 2자 조합 (aa.md, ab.md, ...)
    for (let c1 of 'abcdefghijklmnopqrstuvwxyz') {
        for (let c2 of 'abcdefghijklmnopqrstuvwxyz0123456789') {
            patterns.push(`${c1}${c2}.md`);
        }
    }
    
    // 3-20자 일반 단어 조합
    const commonWords = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'first', 'second', 'third', 'new', 'old', 'my', 'test', 'demo',
        'hello', 'world', 'post', 'blog', 'article', 'story', 'note',
        'about', 'contact', 'home', 'index', 'main', 'intro', 'welcome',
        'guide', 'tutorial', 'how', 'what', 'why', 'when', 'where',
        'javascript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust',
        'react', 'vue', 'angular', 'svelte', 'nodejs', 'typescript',
        'web', 'dev', 'development', 'programming', 'coding', 'code',
        'tips', 'tricks', 'hack', 'best', 'practice', 'example',
        'github', 'pages', 'site', 'website', 'page',
        'diary', 'journal', 'log', 'memo', 'draft', 'writing',
        '2020', '2021', '2022', '2023', '2024', '2025'
    ];
    
    // 단어 조합
    commonWords.forEach(w1 => {
        patterns.push(`${w1}.md`);
        commonWords.forEach(w2 => {
            patterns.push(`${w1}-${w2}.md`);
            patterns.push(`${w1}_${w2}.md`);
        });
    });
    
    // 숫자 조합 (0-999)
    for (let i = 0; i <= 999; i++) {
        patterns.push(`${i}.md`);
        patterns.push(`post${i}.md`);
        patterns.push(`${String(i).padStart(3, '0')}.md`);
    }
    
    // 날짜 형식 (2020-01-01 ~ 2025-12-31)
    for (let year = 2020; year <= 2025; year++) {
        for (let month = 1; month <= 12; month++) {
            for (let day = 1; day <= 31; day++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                patterns.push(`${dateStr}.md`);
            }
        }
    }
    
    console.log(`📋 ${patterns.length}개의 패턴으로 스캔 시작...`);
    
    // 병렬로 파일 존재 여부 확인 (배치 처리)
    const batchSize = 100;
    for (let i = 0; i < patterns.length; i += batchSize) {
        const batch = patterns.slice(i, i + batchSize);
        const checks = batch.map(async (filename) => {
            try {
                const response = await fetch(`posts/${filename}`, { method: 'HEAD' });
                return response.ok ? filename : null;
            } catch {
                return null;
            }
        });
        
        const results = await Promise.all(checks);
        results.forEach(file => {
            if (file && !detectedPosts.includes(file)) {
                detectedPosts.push(file);
                console.log(`✅ 발견: ${file}`);
            }
        });
    }
    
    if (detectedPosts.length > 0) {
        console.log(`\n🎉 총 ${detectedPosts.length}개의 .md 파일을 감지했습니다!`);
        return detectedPosts.sort().reverse();
    }
    
    console.warn('❌ .md 파일을 찾을 수 없습니다.');
    return [];
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
