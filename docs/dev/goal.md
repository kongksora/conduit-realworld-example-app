# Architecture Document: Article Enhancements + Profile About Me

**Branch:** `dev/add-article-read-count-word-stats`

## 1. Current Architecture

```
frontend/src/
├── components/
│   ├── ArticlesPreview/ArticlesPreview.jsx  — 文章卡片组件
│   ├── PopularTags/PopularTags.jsx          — Popular Tags 容器
│   ├── PopularTags/TagButton.jsx            — Tag 按钮
│   └── NavItem/NavItem.jsx                  — Tab 导航组件
├── routes/
│   ├── Home.jsx                             — 首页
│   ├── Article/Article.jsx                  — 文章详情
│   └── Profile/
│       ├── Profile.jsx                      — 个人主页（含 tabs）
│       ├── ProfileArticles.jsx              — My Articles tab
│       └── ProfileFavArticles.jsx           — Favorited Articles tab
├── services/
│   ├── getProfile.js                        — 获取 profile 数据
│   └── userUpdate.js                        — 更新用户信息（含 bio）
├── context/AuthContext.jsx                  — 认证上下文
├── main.jsx                                 — 路由定义
└── styles.css                               — 全局样式
```

## 2. Target Architecture

### Feature 1: 文章列表阅读量字段 [修改]

**Files:**
- `frontend/src/components/ArticlesPreview/ArticlesPreview.jsx` [修改] — 在 "Read more..." 后增加阅读量展示
- `frontend/src/styles.css` [修改] — 新增 `.read-count` 样式

**Data flow:** 纯前端假数据 → 每篇文章随机生成 0~9999 的阅读数，存储在 `useRef` 中避免重渲染变化

**UI placement:** 在 `<span>Read more...</span>` 之后、`<ArticleTags>` 之前

**Edge cases:** 首次渲染时用 `useRef` 初始化随机值，避免每次渲染变化

### Feature 2: Popular Tags 前 5 个金色呼吸背景 [修改]

**Files:**
- `frontend/src/components/PopularTags/TagButton.jsx` [修改] — 前 5 个 tag 添加 `ion-flame` icon + 金色呼吸背景 class
- `frontend/src/styles.css` [修改] — 新增金色呼吸动画

**Data flow:** `tagsList` 数组 → 按接口返回顺序取前 5 个（不排序）→ 添加火焰 icon 和金色呼吸 class

**UI placement:** TagButton 组件内，前 5 个 tag 按钮

**Edge cases:** tags < 5 时所有 tag 都标；空数组不报错

### Feature 3: 个人主页 About Me Tab [新建+修改]

**Files:**
- `frontend/src/routes/Profile/ProfileAbout.jsx` [新建] — About Me 组件，展示 User.bio，若是本人可编辑
- `frontend/src/routes/Profile/Profile.jsx` [修改] — 新增 About Me tab
- `frontend/src/main.jsx` [修改] — 新增路由 `profile/:username/about`

**Data flow:** `getProfile` → `profile.bio` → 展示在 About Me tab。若 `loggedUser.username === username`，显示编辑按钮 → 点击进入编辑模式 → 调用 `userUpdate` 保存 → 更新 UI

**UI placement:** Profile 页面 tabs 区域，"My Articles" 和 "Favorited Articles" 之后新增 "About Me"

**Edge cases:** bio 为空时显示 "No bio yet."；非本人 profile 只读；编辑时使用 textarea + Save/Cancel 按钮

### Feature 4: 文章详情页字数统计 [修改]

**Files:**
- `frontend/src/routes/Article/Article.jsx` [修改] — 在 ArticleTags 之后添加字数统计
- `frontend/src/styles.css` [修改] — 新增 `.word-count` 样式

**Data flow:** `Article.body` 字符串 → `body.length` 算字数 → `Math.ceil(charCount / 300)` 算阅读分钟数

**UI placement:** `<ArticleTags>` 之后、`</div>` (article-content row 结束) 之前

**Edge cases:** body 为空或 undefined 时不显示

## 3. Verification Plan

- `npm run lint` (frontend + backend) — 0 errors
- `npm run test` — 所有现有 tests 通过
- E2E browser 验证四个功能

## 4. Affected Files Checklist

| File | Operation | Summary |
|------|-----------|---------|
| `frontend/src/components/ArticlesPreview/ArticlesPreview.jsx` | 修改 | 添加阅读量展示 |
| `frontend/src/components/PopularTags/TagButton.jsx` | 修改 | 前5个tag金色呼吸背景 |
| `frontend/src/routes/Profile/ProfileAbout.jsx` | 新建 | About Me 组件 |
| `frontend/src/routes/Profile/Profile.jsx` | 修改 | 添加 About Me tab |
| `frontend/src/main.jsx` | 修改 | 添加 about 路由 |
| `frontend/src/routes/Article/Article.jsx` | 修改 | 字数统计 |
| `frontend/src/styles.css` | 修改 | 新增样式 |
