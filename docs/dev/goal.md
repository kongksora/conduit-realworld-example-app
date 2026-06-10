# Frontend UX Enhancement — 四个功能改进

## 分支

`dev/frontend-ux-enhance`

## 现状架构

```
frontend/src/
├── components/          # 可复用 UI 组件
│   ├── ArticlesPreview/ # 文章卡片列表
│   ├── ArticleMeta/     # 文章元信息（作者、日期、操作按钮）
│   ├── AuthorInfo/      # 用户信息（头像、bio、关注按钮）
│   ├── NavItem/         # 导航标签项
│   ├── PopularTags/     # 热门标签侧边栏
│   │   ├── PopularTags.jsx  # 标签列表容器
│   │   └── TagButton.jsx    # 单个标签按钮
│   └── ...
├── routes/
│   ├── Article/
│   │   └── Article.jsx  # 文章详情页
│   ├── Profile/
│   │   ├── Profile.jsx           # 个人主页（含 NavItem tabs）
│   │   ├── ProfileArticles.jsx   # "My Articles" tab 内容
│   │   └── ProfileFavArticles.jsx # "Favorited Articles" tab 内容
│   └── ...
├── services/            # API 调用层
├── hooks/               # 自定义 hooks
├── context/             # React Context
├── helpers/             # 工具函数
├── styles.css           # 全局样式
├── index.css            # 额外样式
└── main.jsx             # 路由入口
```

## 目标架构

```
frontend/src/
├── components/
│   ├── ArticlesPreview/ArticlesPreview.jsx  # [修改] meta 区域增加阅读量展示
│   ├── PopularTags/
│   │   ├── PopularTags.jsx     # [不改]
│   │   └── TagButton.jsx       # [修改] 前5个 tag 火焰背景
│   └── ...
├── routes/
│   ├── Article/
│   │   └── Article.jsx         # [修改] body 下方加字数统计
│   ├── Profile/
│   │   ├── Profile.jsx         # [修改] 加 About Me NavItem
│   │   ├── ProfileAbout.jsx    # [新建] About Me tab 内容组件
│   │   ├── ProfileArticles.jsx # [不改]
│   │   └── ProfileFavArticles.jsx # [不改]
│   └── ...
├── helpers/
│   ├── wordCount.js            # [新建] 字数统计工具函数
│   └── wordCount.test.js       # [新建] 字数统计单元测试
├── styles.css                  # [修改] 火焰背景动画 CSS
└── main.jsx                    # [修改] 新增 profile/:username/about 路由
```

## 四个功能详设

### 功能 1：文章卡片阅读量

- **位置**：`ArticlesPreview.jsx` 的 `ArticleMeta` 区域（现有 favoritesCount 附近）
- **图标**：ionicons 的 `ion-eye`
- **假数据生成**：基于 `article.slug` 的字符串 hash，取模映射到 100~99999 范围，同一 slug 始终产生相同数值
- **显示格式**：`<i class="ion-eye"></i> 12,345`（千位分隔逗号）
- **不涉及**：后端、API、数据库

### 功能 2：Popular Tags 前 5 火焰背景

- **位置**：`TagButton.jsx`，对 `tagsList` 前 5 个 tag 添加火焰动画 CSS class
- **样式**：摇曳火焰背景（CSS animation），颜色在橙-红-黄之间渐变
  - `@keyframes flameFlicker` 动画
  - 背景色在 `#ff4500`、`#ff6347`、`#ffa500`、`#ff8c00` 之间切换
  - 动画时长约 1.5s，infinite alternate
- **纯前端**：只取 `tagsList.slice(0, 5)` 的 tag 附加样式

### 功能 3：Profile 页 About Me Tab

- **路由**：在 `main.jsx` 的 Profile 路由下新增 `<Route path="about" element={<ProfileAbout />} />`
- **Profile.jsx**：在现有 "My Articles" / "Favorited Articles" 之后新增 `<NavItem text="About Me" url="about" state={state} />`
- **ProfileAbout.jsx**（新建）：
  - 从 `useLocation().state` 获取 profile 数据（含 `bio`）
  - 若 state 不可用则通过 `getProfile` API 获取
  - 展示 bio 文本（通过 Markdown 渲染，与 AuthorInfo 一致）
  - 无 bio 时显示 "No bio provided."
- **保留 AuthorInfo 中的 bio**：不移除，两处都展示

### 功能 4：文章详情字数统计

- **位置**：`Article.jsx` 中，`<Markdown>{body}</Markdown>` 下方、`<ArticleTags>` 上方
- **计算逻辑**（`helpers/wordCount.js`）：
  - 先剥离 Markdown 语法（`#`, `*`, `_`, `[]()`, `![]()`, 代码块等）
  - 中文字符：每个汉字计为 1 字
  - 英文单词：连续字母序列计为 1 字
  - 数字不计入
  - 标点不计入
- **阅读时间**：总字数 / 300，向上取整到分钟
- **显示格式**：`<p className="word-count">本文共 {count} 字，预计阅读 {minutes} 分钟</p>`
- **显示条件**：仅当 body 存在时显示

## 验证计划

1. **ESLint 零错误**：`cd frontend && npm run lint`（允许 warnings）
2. **后端 ESLint 零错误**：`cd backend && npm run lint`
3. **单元测试**：`wordCount.test.js` 覆盖中英文混合、纯中文、纯英文、Markdown 剥离等场景
4. **全量测试**：`npm run test`（vitest）
5. **E2E 验证**：浏览器检查四个功能点

## 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/components/ArticlesPreview/ArticlesPreview.jsx` | 修改 | meta 区域加阅读量 |
| `frontend/src/components/PopularTags/TagButton.jsx` | 修改 | 前5个火焰 CSS class |
| `frontend/src/styles.css` | 修改 | 火焰动画 keyframes + .tag-hot |
| `frontend/src/routes/Profile/Profile.jsx` | 修改 | 加 About Me NavItem |
| `frontend/src/routes/Profile/ProfileAbout.jsx` | 新建 | About Me tab 内容 |
| `frontend/src/main.jsx` | 修改 | 新增 about 路由 |
| `frontend/src/helpers/wordCount.js` | 新建 | 字数统计函数 |
| `frontend/src/helpers/wordCount.test.js` | 新建 | 字数统计单测 |
| `frontend/src/routes/Article/Article.jsx` | 修改 | 正文下方加字数统计 |
