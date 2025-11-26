# 웹 개발 팁 모음

2025-03-20

실무에서 유용한 웹 개발 팁들을 공유합니다.

## CSS 팁

### Flexbox 중앙 정렬

```css
.container {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

### 그라데이션 배경

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## JavaScript 팁

### 배열 중복 제거

```javascript
const unique = [...new Set(array)];
```

### 객체 병합

```javascript
const merged = { ...obj1, ...obj2 };
```

## 반응형 디자인

미디어 쿼리를 사용하여 다양한 화면 크기에 대응:

```css
@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }
}
```

## 성능 최적화

- 이미지 최적화
- 코드 압축 (minification)
- 지연 로딩 (lazy loading)
- 캐싱 활용

> 좋은 코드는 읽기 쉬운 코드입니다.

계속해서 새로운 팁들을 추가할 예정입니다!
