# Branch: `dev/article-readcount-tags-profile-wordcount`

## 1. Current Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + SWC, React Router v7 (HashRouter), axios |
| Backend | Express.js + Sequelize + PostgreSQL |
| Styling | Custom CSS (`styles.css`, `index.css`) — no CSS framework |

### Key files and their roles

| File | Role |
|------|------|
| `frontend/src/components/ArticlesPreview/ArticlesPreview.jsx` | Renders article preview cards on home/profile pages |
| `frontend/src/components/PopularTags/PopularTags.jsx` | Sidebar: fetches tags, renders TagButton list |
| `frontend/src/components/PopularTags/TagButton.jsx` | Renders individual tag buttons (first 50) |
| `frontend/src/routes/Profile/Profile.jsx` | Profile page layout: AuthorInfo + tab nav (My Articles / Favorited Articles) |
| `frontend/src/routes/Profile/ProfileArticles.jsx` | "My Articles" tab content |
| `frontend/src/routes/Profile/ProfileFavArticles.jsx` | "Favorited Articles" tab content |
| `frontend/src/routes/Article/Article.jsx` | Article detail page: renders markdown body |
| `frontend/src/components/AuthorInfo/AuthorInfo.jsx` | Profile header: avatar, username, bio (markdown), follow/edit button |
| `frontend/src/components/NavItem/NavItem.jsx` | Reusable tab nav link |
| `frontend/src/main.jsx` | Route definitions |
| `frontend/src/services/getProfile.js` | Fetches profile by username (returns `data.profile`) |
| `backend/models/User.js` | User model with `bio: DataTypes.TEXT` |
| `backend/controllers/profiles.js` | Profile API: returns profile including `bio` |

### Data flow for articles
```
useArticles() → getArticles() → GET /api/articles?... → 
  { articles, articlesCount } → ArticlesPreview → .article-preview cards
```

### Data flow for profile
```
AuthorInfo → getProfile() → GET /api/profiles/:username → 
  { profile: { bio, image, following, followersCount } } → rendered in header
```

### Data flow for tags
```
PopularTags → getTags() → GET /api/tags → 
  { tags: [...] } → TagButton → .tag-pill buttons
```

## 2. Target Architecture

### Feature A: 文章列表阅读量

**Files to touch:**
- `frontend/src/components/ArticlesPreview/ArticlesPreview.jsx` [修改]

**Design:**
- After `<span>Read more...</span>`, before `<ArticleTags>`, insert a `<span className="read-count">`
- Icon: `<i className="ion-eye"></i>` (ionicons is already loaded)
- Number: `Math.floor(Math.random() * 10000)` — generated once per render, stable for a given article instance
- Styling: inline or in `styles.css`

**Data flow:** No data source — fake random number generated in the component.

**Edge cases:**
- N/A (always shows a random number 0-9999)

### Feature B: Popular Tags 前5个标金色+呼吸效果

**Files to touch:**
- `frontend/src/components/PopularTags/TagButton.jsx` [修改]
- `frontend/src/styles.css` [修改] (or `index.css`)

**Design:**
- In `TagButton`, for the first 5 tags in `tagsList`, add class `tag-popular`
- CSS: `.tag-popular { background: gold; animation: breathe 1.5s ease-in-out infinite; }`
- `@keyframes breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`

**Data flow:** `tagsList` from API → `tagsList.slice(0, 5)` get `.tag-popular` class, rest unchanged.

**Edge cases:**
- `< 5 tags: all get highlighted`
- 0 tags: no highlighting (handled by existing empty state)

### Feature C: Profile 新增 About Me Tab

**Files to touch:**
- `frontend/src/routes/Profile/Profile.jsx` [修改]
- `frontend/src/routes/Profile/ProfileAbout.jsx` [新建]
- `frontend/src/main.jsx` [修改]

**Design:**
- Add third `<NavItem text="About Me" url="about" state={state} />` after existing two NavItems
- Add route `<Route path="about" element={<ProfileAbout />} />` under profile route
- `ProfileAbout` component: reads profile from API via `getProfile({ headers, username })`, displays `bio` as markdown
- Empty bio: display placeholder "This user hasn't written a bio yet."
- Uses existing `useAuth()` for headers, `useParams()` for username

**Data flow:** `ProfileAbout → getProfile() → GET /api/profiles/:username → profile.bio → Markdown render`

**Edge cases:**
- `bio` is null/empty → "This user hasn't written a bio yet."
- API error → navigate to /not-found (consistent with AuthorInfo)
- Loading state → "Loading..."

### Feature D: 文章详情页字数统计

**Files to touch:**
- `frontend/src/routes/Article/Article.jsx` [修改]

**Design:**
- After `<ArticleTags tagList={tagList} />`, before closing `</div>`, add a `<p className="article-word-count">`
- Text: "本文共 {charCount} 字，预计阅读 {readingTime} 分钟"
- `charCount = body.replace(/\s/g, '').length` (strip whitespace, count characters — works for both Chinese and mixed content)
- `readingTime = Math.max(1, Math.ceil(charCount / 300))`
- Styling: muted color, centered or left-aligned below article tags

**Data flow:** `article.body` (markdown string) → strip markdown? No — count raw body characters excluding whitespace → compute charCount and readingTime

**Edge cases:**
- Body is empty/missing → don't render the stats line
- Short articles (e.g. < 300 chars) → "预计阅读 1 分钟" via `Math.max(1, ...)`

## 3. Verification Plan

### Lint
```bash
cd frontend && npm run lint
```

### E2E Browser Verification (one BrowserInspect per feature)
1. **Read count**: Visit http://localhost:3000/, verify `.read-count` exists with ion-eye icon and a number after "Read more..."
2. **Popular Tags**: Visit http://localhost:3000/, verify first 5 tags have gold background + breathing animation
3. **About Me tab**: Visit profile page, click "About Me" tab, verify bio renders
4. **Word count**: Visit any article page, verify word count + reading time below article body

## 4. Affected Files Checklist

| File | Operation | Summary |
|------|-----------|---------|
| `frontend/src/components/ArticlesPreview/ArticlesPreview.jsx` | 修改 | Add read-count span with ion-eye icon + fake number |
| `frontend/src/components/PopularTags/TagButton.jsx` | 修改 | Add `.tag-popular` class to first 5 tags |
| `frontend/src/styles.css` | 修改 | Add `.tag-popular` and `@keyframes breathe` styles |
| `frontend/src/routes/Profile/Profile.jsx` | 修改 | Add "About Me" NavItem |
| `frontend/src/routes/Profile/ProfileAbout.jsx` | 新建 | New component showing User.bio |
| `frontend/src/main.jsx` | 修改 | Add ProfileAbout route |
| `frontend/src/routes/Article/Article.jsx` | 修改 | Add word count + reading time |
| `docs/dev/goal.md` | 新建 | This document |
