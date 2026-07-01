# Process Log（项目进度日志）

## 1. 当前阶段（Current Phase）

- [x] 阶段0：项目骨架搭建（已完成）
- [x] 阶段1：前端静态页面 + Mock 数据上线（已完成）
- [x] 阶段2：CloudBase 后端对接（已完成）
- [x] 阶段3：地图与通勤能力接入（已完成）
- [ ] 阶段4：真实房产数据接入（当前阶段）
- [ ] 阶段5：扩展与优化

---

## 2. 详细任务拆解

### 阶段0：项目骨架搭建

- [x] 0.1 创建项目目录结构（`proj/`）
- [x] 0.2 创建配置文件（`package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `cloudbaserc.json`, `.env.example`, `.gitignore`）
- [x] 0.3 创建 `index.html` 入口
- [x] 0.4 创建 `public/favicon.svg`
- [x] 0.5 创建空页面文件（`src/pages/` 5 个页面）
- [x] 0.6 创建空组件文件（`src/components/` 3 个组件）
- [x] 0.7 创建空工具文件（`src/utils/` 2 个文件, `src/services/` 1 个文件）
- [x] 0.8 创建空云函数文件（`cloudfunctions/` 3 个函数）
- [x] 0.9 创建云函数 `package.json`（3 个）
- [x] 0.10 安装依赖 `npm install`
- [x] 0.11 验证 `npm run dev` 能正常启动

---

### 阶段1：前端静态页面 + Mock 数据上线

> **目标**：纯前端可运行，所有数据来自 Mock 文件，零后端调用，零成本部署到 CloudBase 静态托管。
> **对应 TechSpec 第8章"阶段一"**

#### 1.1 基础设施

- [x] 1.1.1 填写 `src/main.jsx` — React 入口，挂载 App
- [x] 1.1.2 填写 `src/App.jsx` — 根组件，配置 react-router-dom 路由
- [x] 1.1.3 填写 `src/index.css` — Tailwind 全局样式
- [x] 1.1.4 从 `Prototype/src/data/mockData.js` 迁移 Mock 数据到 `src/data/mockData.js`

#### 1.2 工具函数

- [x] 1.2.1 填写 `src/utils/formatter.js` — 价格格式化（`formatPrice`）、数字千分位（`formatNumber`）、距离格式化（`formatDistance`）、相对时间（`formatRelativeTime`）
- [x] 1.2.2 填写 `src/utils/storage.js` — localStorage 封装（`getItem`/`setItem`/`removeItem`，支持 TTL 过期），小区精简列表缓存（`getCommunityList`/`setCommunityList`），搜索历史（`getSearchHistory`/`addSearchHistory`）

#### 1.3 通用组件

- [x] 1.3.1 填写 `src/components/SearchBar.jsx` — 搜索栏，含输入框 + 搜索图标（lucide-react），支持 onSubmit 回调
- [x] 1.3.2 填写 `src/components/CommunityCard.jsx` — 小区卡片，展示名称、均价、区域、价格趋势，支持 loading 骨架屏和空状态
- [x] 1.3.3 填写 `src/components/PriceChart.jsx` — 价格走势图（MVP 阶段可用简单柱状图或占位，后续升级为 ECharts）

#### 1.4 页面

- [x] 1.4.1 填写 `src/pages/HomePage.jsx` — 首页：搜索栏 + 小区列表（Mock 数据），支持关键词过滤
- [x] 1.4.2 填写 `src/pages/DetailPage.jsx` — 小区详情页：基本信息、价格趋势、看房关注等级、评分明细、替代小区、数据来源声明
- [x] 1.4.3 填写 `src/pages/ComparePage.jsx` — 对比页：选择 2-3 个小区，表格对比关键指标
- [x] 1.4.4 填写 `src/pages/FavoritesPage.jsx` — 收藏页（MVP 阶段用 localStorage 模拟，暂不接后端）
- [x] 1.4.5 填写 `src/pages/ChecklistPage.jsx` — 看房清单页

#### 1.5 部署

- [x] 1.5.1 注册腾讯云 CloudBase 账号，创建环境（环境 ID: `house-ass-d7glvbrq60ad20614`）
- [x] 1.5.2 安装 CloudBase CLI：`npm install -g @cloudbase/cli`（v3.5.8）
- [x] 1.5.3 执行 `npm run build` 构建生产版本（dist/ 已生成，225KB JS + 23KB CSS）
- [x] 1.5.4 部署到 CloudBase 静态网站托管（已完成，见阶段2）
- [x] 1.5.5 验证线上访问正常

---

### 阶段2：CloudBase 后端对接

> **目标**：将 Mock 数据导入 CloudBase 云数据库，实现搜索、详情、收藏、订阅、按需刷新。
> **对应 TechSpec 第8章"阶段二"**

#### 2.1 数据库

- [x] 2.1.1 在 CloudBase 控制台创建集合：`communities`, `users`, `data_sync_jobs`
- [x] 2.1.2 设置集合安全规则（`communities` 所有用户可读，`favorites` 仅创建者可读写）
- [x] 2.1.3 将 Mock 数据（20 条）导入 `communities` 集合
- [x] 2.1.4 为 `communities` 的 `searchKeywords`、`city`、`district`、`avgPrice`、`attentionLevel` 字段创建索引

#### 2.2 云函数 — communities

- [x] 2.2.1 填写 `cloudfunctions/communities/index.js` — 入口，按 `action` 分发
- [x] 2.2.2 实现 `action: 'search'` — 小区搜索（关键词 + 城市 + 区域 + 排序 + 分页）
- [x] 2.2.3 实现 `action: 'detail'` — 小区详情（含 `needsRefresh` 判断）
- [x] 2.2.4 实现 `action: 'compare'` — 小区对比（最多 5 个）
- [x] 2.2.5 实现 `action: 'suggestions'` — 搜索建议（返回精简列表）
- [x] 2.2.6 部署 communities 云函数，验证接口可用

#### 2.3 云函数 — users

- [x] 2.3.1 填写 `cloudfunctions/users/index.js` — 入口，按 `action` 分发
- [x] 2.3.2 实现 `action: 'add-favorite'` / `'remove-favorite'` / `'get-favorites'` — 收藏管理
- [x] 2.3.3 实现 `action: 'subscribe'` / `'unsubscribe'` / `'get-subscriptions'` — 订阅管理
- [x] 2.3.4 实现 `action: 'get-notifications'` / `'mark-read'` — 通知管理
- [x] 2.3.5 部署 users 云函数，验证接口可用

#### 2.4 云函数 — dataSync

- [x] 2.4.1 填写 `cloudfunctions/dataSync/index.js` — 入口，按 `action` 分发
- [x] 2.4.2 实现 `action: 'refresh'` — 按需刷新单个小区（含 `data_sync_jobs` 防重复锁定 + 重试机制）
- [x] 2.4.3 部署 dataSync 云函数

#### 2.5 前端对接

- [x] 2.5.1 填写 `src/services/cloudbase.js` — CloudBase SDK 初始化 + 匿名登录 + `callFunction` 封装（已支持 Mock 模式自动降级）
- [x] 2.5.2 改造 `HomePage.jsx` — 搜索接入云函数，热门小区从 API 加载
- [x] 2.5.3 改造 `DetailPage.jsx` — 详情接入云函数，渲染完成后 fire-and-forget 触发刷新
- [x] 2.5.4 改造 `ComparePage.jsx` — 对比接入云函数
- [x] 2.5.5 改造 `FavoritesPage.jsx` — 收藏接入云函数，本地+云端双写

---

### 阶段3：地图与通勤能力接入

> **目标**：通过高德地图 API 提供通勤时间、地铁距离、周边配套等空间信息。
> **对应 TechSpec 第8章"阶段三"**

- [x] 3.1 注册高德开放平台账号，获取 Web 服务 API Key
- [x] 3.2 在 CloudBase 控制台配置云函数环境变量 `AMAP_API_KEY`
- [x] 3.3 在 communities 云函数中新增 `action: 'commute'` — 通勤时间计算（驾车/公交/步行）
- [x] 3.4 在 communities 云函数中新增 `action: 'nearby-poi'` — 周边配套查询（学校/医院/商场/地铁/餐饮）
- [x] 3.5 在 DetailPage 中新增通勤时间展示模块（目的地输入 + 出行方式选择 + 预设常用目的地）
- [x] 3.6 在 DetailPage 中新增周边配套展示模块（5类POI分类展示）
- [x] 3.7 做好服务端缓存（同一小区 + 同一目标地的通勤时间缓存 24 小时）

---

### 阶段4：真实房产数据接入

> **目标**：通过授权 API 接入真实房价、成交数据，替代 Mock 数据。
> **对应 TechSpec 第8章"阶段四"**

- [ ] 4.1 调研并确认房产数据 API 供应商（聚合数据 / 贝壳开放平台 / 其他）
- [ ] 4.2 确认 API 授权方式、计费模式、字段覆盖范围、调用频率限制
- [ ] 4.3 设计数据适配层（统一不同数据源的字段映射）
- [ ] 4.4 在 dataSync 云函数中实现真实数据拉取逻辑
- [ ] 4.5 实现数据质量校验（必填字段检查、价格合理性校验、经纬度有效性）
- [ ] 4.6 灰度切换：选择 10 个热门小区先接入真实数据，验证后再全量切换
- [ ] 4.7 完善 `sourceInfo` 字段（标注数据来源、可信度、更新时间）

---

### 阶段5：扩展与优化

> **目标**：小程序、AI 智能解读、推荐算法、复杂筛选排序等高级功能。
> **对应 TechSpec 第8章"阶段五"**

- [ ] 5.1 性能优化：图片懒加载、组件懒加载（React.lazy）、首屏加载优化
- [ ] 5.2 SEO：添加 meta 标签、og 标签、sitemap
- [ ] 5.3 复杂筛选排序：多条件组合筛选（价格区间、建成年份、物业费、绿化率、地铁距离）
- [ ] 5.4 价格走势图升级：接入 ECharts 或 Recharts，展示真实成交趋势
- [ ] 5.5 用户反馈与纠错：前端反馈入口 + 云函数处理 + `feedbacks` 集合存储
- [ ] 5.6 合规完善：隐私政策页面、数据删除入口、用户协议
- [ ] 5.7 小程序版本：使用 Taro 3 框架，复用 Web 端业务逻辑
- [ ] 5.8 AI 智能解读：接入国内大模型，对小区进行综合解读（需先确认合规）

---

## 3. 最近一次完成的任务（Latest Completed Task）

- [2026-06-29] **阶段3 全部完成**：地图与通勤能力接入。包括：
  - 配置高德地图 API Key 到 CloudBase 环境变量。
  - 云函数 communities 新增 `commute` action（支持驾车/公交/步行三种模式，自动地理编码解析目的地，24小时缓存）。
  - 云函数 communities 新增 `nearby-poi` action（并行查询学校、医院、购物、地铁站、餐饮5类POI）。
  - 前端 api.js 新增 `getCommuteTime` 和 `getNearbyPoi` 方法（含 Mock 降级）。
  - DetailPage 新增「通勤时间」tab：目的地输入 + 出行方式切换 + 7个预设常用目的地 + 结果展示。
  - DetailPage 新增「周边配套」tab：分类展示5类POI，每类最多5条，支持距离和类型标签。
  - 云函数 + 前端已部署到 CloudBase。

---

## 4. 待解决的问题 / 下一步计划

- **下一步**：阶段4 — 真实房产数据接入（需调研确认 API 供应商，如聚合数据 / 贝壳开放平台）

---

## 5. 关键技术决策备忘（Tech Decisions）

- **前端框架**：React 18 + Vite，已在原型中验证
- **UI 方案**：Tailwind CSS 3，灵活轻量，不引入组件库的额外学习成本
- **图标库**：Lucide React，轻量、美观、开箱即用
- **BaaS 平台**：腾讯云 CloudBase（云开发），国内最成熟的 Serverless 平台
- **数据库**：CloudBase 文档型 NoSQL（类 MongoDB），免运维、自动扩容
- **API 调用方式**：前端通过 CloudBase SDK `callFunction` 调用云函数，不暴露 HTTP 接口（避免配置网关、路由、CORS、自定义域名）
- **API Key 安全**：所有外部 API Key 存放在云函数环境变量中，仓库只放 `.env.example` 模板
- **认证策略**：匿名浏览 + 收藏时登录（微信/手机号二选一），降低 MVP 阶段流失率
- **数据更新策略**：按需触发 + 惰性更新（fire-and-forget），当用户访问超过 7 天未更新数据的小区时异步触发刷新，使用 `data_sync_jobs` 集合做防重复和重试
- **搜索策略**：初期小区数量 < 1 万条时，搜索建议优先在前端通过 localStorage 缓存的小区精简列表纯 JS 计算，不调云函数
- **数据冗余**：`favorites` 冗余 `communityName`/`district`/`avgPrice`，`alternatives` 存对象数组（含 id/name/avgPrice），减少数据库二次查询
- **合规表达**：不使用"推荐"/"不建议"等投资建议表述，改用"看房优先级高"/"看房优先级低"；每个详情页展示数据来源和可信度
- **MVP 定位**：Web 优先、匿名优先、Mock 数据优先、授权数据源后置