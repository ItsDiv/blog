# 📝 My Blog

GitHub Pages를 사용한 간단하고 깔끔한 블로그입니다.

## ✨ 특징

- 📁 `posts` 폴더의 마크다운 파일 자동 감지
- 🎨 모던하고 반응형 디자인
- 📱 모바일 친화적
- ⚡ 빠른 로딩 속도
- 🔍 마크다운 형식 지원

## 🚀 시작하기

### 로컬에서 실행

1. 이 저장소를 클론합니다:
```bash
git clone https://github.com/your-username/paras-blog.git
cd paras-blog
```

2. 로컬 서버를 실행합니다:
```bash
# Python 3를 사용하는 경우
python -m http.server 8000

# Python 2를 사용하는 경우
python -m SimpleHTTPServer 8000

# Node.js를 사용하는 경우 (http-server 설치 필요)
npx http-server
```

3. 브라우저에서 `http://localhost:8000`을 엽니다.

### GitHub Pages에 배포

1. GitHub에 새 저장소를 만듭니다.

2. 코드를 푸시합니다:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

3. 저장소 Settings → Pages로 이동합니다.

4. Source를 `main` 브랜치로 설정합니다.

5. 몇 분 후 `https://your-username.github.io/your-repo`에서 블로그를 확인할 수 있습니다!

## 📝 새 포스트 추가하기 (자동 감지)

1. `posts` 폴더에 `.md` 파일을 생성합니다.

2. 마크다운 형식으로 내용을 작성합니다:
```markdown
# 포스트 제목

2025-03-20

여기에 내용을 작성하세요...
```

3. **자동으로 감지시키기:**

   **방법 1: Node.js (추천)**
   ```bash
   npm run generate
   ```
   
   또는 파일 변경 감지 (자동 재생성):
   ```bash
   npm install
   npm run watch
   ```

   **방법 2: PowerShell**
   ```powershell
   .\generate-posts.ps1
   ```

   **방법 3: GitHub Actions (완전 자동)**
   - posts 폴더에 파일 추가/수정하고 push
   - GitHub Actions가 자동으로 posts.json 생성

4. 변경사항을 커밋하고 푸시:
```bash
git add .
git commit -m "Add new post"
git push
```

## 📂 프로젝트 구조

```
paras-blog/
├── index.html          # 메인 HTML 파일
├── styles.css          # 스타일시트
├── app.js              # 블로그 로직
├── posts.json          # 포스트 목록
├── posts/              # 마크다운 포스트 폴더
│   ├── first-post.md
│   ├── github-pages-guide.md
│   └── web-dev-tips.md
└── README.md           # 이 파일
```

## 🎨 커스터마이징

### 블로그 제목 변경

`index.html`에서 다음 부분을 수정하세요:
```html
<h1>📝 My Blog</h1>
<p class="subtitle">생각을 기록하는 공간</p>
```

### 색상 테마 변경

`styles.css`에서 헤더 그라데이션을 수정하세요:
```css
header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 폰트 변경

`styles.css`의 `body` 선택자에서 `font-family`를 수정하세요.

## 📄 마크다운 지원

다음과 같은 마크다운 문법을 지원합니다:

- 제목 (`#`, `##`, `###`)
- **굵은 글씨** (`**텍스트**`)
- *기울임* (`*텍스트*`)
- `인라인 코드` (\`코드\`)
- 코드 블록 (\`\`\`코드\`\`\`)
- [링크](url) (`[텍스트](url)`)
- 리스트 (`-` 또는 `*`)
- 인용문 (`>`)

## 🤝 기여하기

이슈나 풀 리퀘스트는 언제든 환영합니다!

## 📝 라이선스

MIT License

## 📞 문의

질문이나 제안사항이 있으시면 이슈를 열어주세요.

---

Made with ❤️ using GitHub Pages
