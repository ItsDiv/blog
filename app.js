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
    // 1) posts.json 우선 시도 (있으면 가장 정확)
    try {
        const resp = await fetch('posts.json');
        if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data.posts) && data.posts.length) {
                // normalize to objects with name + url
                return data.posts.map(p => {
                    if (typeof p === 'string') return { name: p, url: `posts/${p}` };
                    return p;
                });
            }
        }
    } catch (e) {
        // ignore
    }

    // 2) GitHub Pages에 배포된 경우: GitHub REST API로 레포지토리의 posts 폴더 내용을 조회
    //    이 방법은 별도 빌드 없이도 깃허브 저장소의 posts 파일 목록을 가져올 수 있습니다.
    try {
        if (location.protocol === 'file:') {
            // 로컬 파일 시스템에서는 불가능
            console.warn('로컬 파일 시스템(file://)에서는 자동 감지가 제한됩니다. posts.json을 생성하세요.');
            return [];
        }

        const host = window.location.hostname.toLowerCase();
        const pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');

        const candidates = [];

            // Try to discover repo from page links (helps custom domains)
            function findRepoFromPage() {
                try {
                    const anchors = Array.from(document.querySelectorAll('a[href*="github.com/"]'));
                    for (const a of anchors) {
                        try {
                            const url = new URL(a.href);
                            const parts = url.pathname.split('/').filter(Boolean);
                            // expect /owner/repo or /owner/repo/...
                            if (parts.length >= 2) {
                                return { owner: parts[0], repo: parts[1] };
                            }
                        } catch (e) {}
                    }
                } catch (e) {}
                return null;
            }

        // username.github.io 또는 username.github.io/repo
        if (host.endsWith('.github.io')) {
            const owner = host.split('.github.io')[0];
            if (pathname) {
                // likely project page: owner.github.io/repo
                const repo = pathname.split('/')[0];
                candidates.push({ owner, repo });
            }
            // user site repo name is `${owner}.github.io`
            candidates.push({ owner, repo: `${owner}.github.io` });
        }

        // If path looks like /owner/repo/ (rare on pages), add it
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
            candidates.push({ owner: pathParts[0], repo: pathParts[1] });
        }

        // As a final guess, try using first path segment as repo and host without github.io as owner
        if (!host.endsWith('.github.io') && pathParts.length > 0) {
            const ownerGuess = host.split('.')[0];
            candidates.push({ owner: ownerGuess, repo: pathParts[0] });
        }

        // Also try to find a GitHub repo link in the current page (helps custom domains)
        const pageRepo = findRepoFromPage();
        if (pageRepo) candidates.push(pageRepo);

        // De-duplicate
        const uniq = [];
        for (const c of candidates) {
            const key = `${c.owner}/${c.repo}`;
            if (!uniq.find(u => u.owner === c.owner && u.repo === c.repo)) uniq.push(c);
        }

        for (const c of uniq) {
            try {
                const apiUrl = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/posts`;
                const r = await fetch(apiUrl);
                if (!r.ok) continue;
                const items = await r.json();
                if (Array.isArray(items)) {
                    const mdFiles = items
                            .filter(it => it.type === 'file' && it.name.toLowerCase().endsWith('.parasblog'))
                            .map(it => ({ name: it.name, url: it.download_url }));
                        if (mdFiles.length) {
                            console.log(`GitHub API로 ${c.owner}/${c.repo}의 posts 폴더에서 ${mdFiles.length}개 감지`);
                            return mdFiles.sort((a,b) => b.name.localeCompare(a.name));
                        }
                }
            } catch (e) {
                // continue to next candidate
            }
        }
    } catch (e) {
        // ignore and fall through to HTML fallback
    }

    // 3) Fallback: posts/ 경로를 fetch해서 반환되는 HTML에서 .md 링크를 추출 (posts/index.html이 있는 경우)
    try {
        const resp = await fetch('posts/');
        if (resp.ok) {
            const text = await resp.text();
            // find hrefs ending with .parasblog
            const hrefs = Array.from(text.matchAll(/href\s*=\s*"([^"']+\.parasblog)"/gi), m => m[1]);
            const names = hrefs
                .map(h => h.replace(/^.*\//, ''))
                .filter((v, i, a) => v && a.indexOf(v) === i);
                if (names.length) {
                    console.log(`posts/index.html에서 ${names.length}개 감지`);
                    return names.map(n => ({ name: n, url: `posts/${n}` })).sort((a,b) => b.name.localeCompare(a.name));
                }
        }
    } catch (e) {
        // ignore
    }

    console.warn('자동 감지 실패: posts.json을 생성하거나 GitHub Pages에 배포하세요.');
    return [];
}

// Fetch and parse a single post
async function fetchPost(file) {
    // file can be either a string filename or an object {name, url}
    let name, url;
    if (typeof file === 'string') {
        name = file;
        url = `posts/${file}`;
    } else if (file && typeof file === 'object') {
        name = file.name;
        url = file.url || `posts/${file.name}`;
    } else {
        return null;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${name}`);
        }
        const content = await response.text();
        const metadata = extractMetadata(content);

        return {
            filename: name,
            sourceUrl: url,
            ...metadata
        };
    } catch (error) {
        console.error(`Error loading post ${name}:`, error);
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
            postFiles.map(f => fetchPost(f))
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
            
            const encodedUrl = encodeURIComponent(post.sourceUrl || `posts/${post.filename}`);
            return `
                <article class="post-card" onclick="viewPost('${encodedUrl}')">
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
async function viewPost(encodedUrl) {
    const container = document.getElementById('posts-container');
    container.innerHTML = '<div class="loading">포스트를 불러오는 중...</div>';
    const url = decodeURIComponent(encodedUrl);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}`);
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
