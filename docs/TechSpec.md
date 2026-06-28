# 豪斯助手（House Assistant）技术规格说明书

> **版本**: V0.1 | **日期**: 2026-06-23 | **角色**: 面向独立开发者的零运维技术方案

---

## 1. 核心架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户浏览器（Web 优先）                      │
│                          (React SPA)                                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    腾讯云 CloudBase (云开发)                           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  静态网站托管  │  │  云函数 SCF   │  │     云数据库 (NoSQL)      │  │
│  │  (CDN 加速)   │  │  (Node.js)   │  │   (类 MongoDB 文档型)     │  │
│  │              │  │              │  │                          │  │
│  │  • HTML/JS   │  │  • 搜索服务   │  │  • communities          │  │
│  │  • CSS/图片   │  │  • 数据聚合   │  │  • users                │  │
│  │  • 自动部署   │  │  • 按需更新   │  │  • favorites            │  │
│  │              │  │  • 通知推送   │  │  • transactions         │  │
│  └──────────────┘  └──────────────┘  │  • subscriptions         │  │
│                                       └──────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      云开发 身份认证                            │   │
│  │          • 匿名浏览（默认）• 微信登录/手机号（收藏时）             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 按需触发 / 云函数代理
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         外部数据服务                                   │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  房产数据 API      │  │  地图/通勤 API    │  │  通知服务          │  │
│  │  (聚合数据等)       │  │  (高德地图)        │  │  (微信订阅消息)     │  │
│  │  • 小区信息        │  │  • 地铁距离计算    │  │  • 价格变动通知     │  │
│  │  • 成交数据        │  │  • 通勤时间估算    │  │  • 新上房源提醒     │  │
│  │  • 挂牌数据        │  │  • 周边配套查询    │  │                    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  ⚠️ 重要：所有外部 API 调用必须通过云函数代理，API Key 只存放在        │
│     云函数环境变量中，绝不出现在前端代码中。                            │
└─────────────────────────────────────────────────────────────────────┘
```

**架构说明（给非技术人员的通俗解释）** ：

- **你的网站**（前端）放在腾讯云 CDN 上，用户访问速度飞快，且你不需要管服务器
- **后端逻辑**是一小段一小段的"云函数"，只在被调用时才运行，不调用不花钱
- **数据库**是腾讯云帮你管好的文档数据库，不需要你安装、配置、备份
- **用户登录**默认匿名浏览，只在收藏/订阅时提示登录（微信或手机号二选一），降低流失率
- **外部数据**通过云函数代理访问，API Key 安全存放在云函数环境变量中；当用户访问超过 7 天未更新数据的小区时，触发一次异步更新
- **MVP 定位**：Web 优先、匿名优先、Mock 数据优先，先验证产品体验再接入真实数据

> ⚠️ **重要注意事项：API Key 安全**
>
> 调用外部 API（如聚合数据、高德地图）时，**绝对不要把 API Key 写在前端代码里**。一旦 Key 暴露在浏览器端，任何人都可以通过开发者工具看到并盗用，轻则额度被刷爆，重则产生巨额账单。
>
> **正确做法：前端 → 云函数 → 外部 API**
> ```
> 浏览器（无 Key）  ──请求──▶  云函数（有 Key）  ──请求──▶  外部 API
> ```
> 1. 前端只请求自己的云函数，请求中不携带任何 Key
> 2. 云函数从环境变量中读取 API Key，在服务端发起请求
> 3. 云函数将结果返回给前端
>
> 在 CloudBase 中，生产环境 Key 只在**控制台 → 云函数 → 环境变量/密钥管理**中配置，
> 仓库中只放 `.env.example` 作为模板（不含真实 Key）：
> ```bash
> # .env.example (提交到 Git)
> AMAP_API_KEY=your_amap_key_here
> JUHE_API_KEY=your_juhe_key_here
> ```

---

## 2. 技术栈推荐

### 方案总览（MVP）

| 层级         | 技术选型                           | 为什么选它                                | 备注                         |
| ------------ | ---------------------------------- | ----------------------------------------- | ---------------------------- |
| **前端**     | React 18 + Vite                    | 已在原型中验证；生态最大、中文教程最多    | 免费                         |
| **UI**       | Tailwind CSS 3（或 TDesign React） | Tailwind 灵活；TDesign 组件更完整开箱即用 | 免费                         |
| **图标**     | Lucide React                       | 轻量、美观、开箱即用                      | 免费                         |
| **BaaS**     | **腾讯云 CloudBase（云开发）**     | 国内最成熟的 Serverless 平台，零运维      | 见下方成本模型               |
| **数据库**   | CloudBase 文档型 NoSQL             | 免运维、自动扩容、与云函数天然集成        | 后期可升级 PostgreSQL        |
| **后端**     | CloudBase 云函数（Node.js 18/20）  | 按调用次数计费，不调用不花钱              | 忌拆太细，2-3 个函数即可     |
| **部署**     | CloudBase 静态网站托管             | 国内 CDN 加速，自带 HTTPS                 | —                            |
| **认证**     | **匿名浏览** + 收藏时登录          | 最低流失率、最低成本                      | Web 端匿名 + 微信/手机二选一 |
| **地图**     | 高德地图 Web 服务 API              | 国内最稳定                                | 配额以控制台最新协议为准     |
| **房产数据** | **Mock/手工数据起步** + 适配层     | 先验证产品，再接入真实 API                | 见风险评估                   |
| **AI 功能**  | V0.1 不做                          | 避免合规、成本、备案复杂度                | 后期再接国内大模型           |

### 成本模型（三层渐进）

> **重要**：以下为估算参考，实际费用以腾讯云控制台实时计费页为准。腾讯云当前使用"资源点计费"，免费体验环境每月提供 3000 点资源点。建议在控制台设置**预算上限 + 余额告警 + 日调用量限制**，防止意外超支。

**第一层：MVP 零成本验证**

| 策略                                            | 预估成本  |
| ----------------------------------------------- | --------- |
| 静态 Mock 数据（不调用云函数）                  | ¥0/月     |
| CloudBase 免费体验环境                          | ¥0/月     |
| 匿名浏览（不触发认证计费）                      | ¥0/月     |
| 纯前端搜索建议（localStorage 缓存，不查数据库） | ¥0/月     |
| **合计**                                        | **¥0/月** |

**第二层：小流量内测（日均 100-500 UV）**

| 资源               | 预估用量            | 预估成本      |
| ------------------ | ------------------- | ------------- |
| CloudBase 按量计费 | 数据库读写 + 云函数 | ¥0-50/月      |
| 高德地图 API       | 通勤计算 + 地铁查询 | ¥0-30/月      |
| 短信验证码         | 仅收藏/订阅时触发   | ¥0-20/月      |
| **合计**           | —                   | **¥0-100/月** |

**第三层：真实数据接入（重点关注）**

> ⚠️ **一号成本风险**：房产数据 API 是最大的不确定成本项，不和服务器成本混在一起估算。

| 数据源              | 预估成本       | 说明                                   |
| ------------------- | -------------- | -------------------------------------- |
| 聚合数据房产 API    | ¥300-1000/月   | 按调用量计费，取决于小区数量和更新频率 |
| 贝壳开放平台        | 需企业合作申请 | 更偏企业服务，非开箱即用公共 API       |
| 手工维护 + 公开数据 | ¥0/月          | 初期最稳妥，但数据覆盖面和更新频率受限 |

### 为什么不选其他方案？

| 方案                       | 不推荐原因                                           |
| -------------------------- | ---------------------------------------------------- |
| **Supabase**               | 服务器在海外，国内访问慢；中文文档少                 |
| **Firebase**               | Google 服务，国内完全不可用                          |
| **Vercel + 自建后端**      | Vercel 在国内访问不稳定；需要单独部署后端            |
| **阿里云 FC + 自建数据库** | 需要分别配置多个服务，运维复杂度高                   |
| **传统云服务器（ECS）**    | 需要自己装系统、配环境、设防火墙、做备份，运维负担重 |
| **LeanCloud**              | 被字节收购后发展停滞，社区活跃度下降                 |

### 小程序扩展（阶段五可选项）

如果未来需要小程序版本，推荐使用 **Taro 3** 框架，一套 React 代码可以编译到微信小程序，与 Web 端共享 80% 以上的业务逻辑。但 MVP 阶段不建议同时做小程序，优先验证 Web 版。

---

## 3. 数据库设计

### 3.1 集合（表）概览

CloudBase 使用文档型数据库（类似 MongoDB），每个"表"称为一个**集合（Collection）**。

```
数据库: house_assistant
├── communities          # 小区/楼盘数据（核心）
├── transactions          # 成交记录（高频写入）
├── users                 # 用户信息
├── favorites             # 用户收藏
├── subscriptions         # 用户订阅
├── notifications         # 通知记录
├── search_history        # 搜索历史（保留30天）
├── data_sync_jobs        # 数据同步任务（异步刷新队列）
└── feedbacks             # 用户反馈与纠错
```

### 3.2 集合详细设计

#### `communities` — 小区/楼盘数据

```javascript
{
  _id: "wankeyuan",                    // 唯一标识（语义化ID）
  name: "万科星园",                     // 小区名称
  city: "北京",                         // 城市
  district: "朝阳区",                   // 行政区
  subDistrict: "北苑",                  // 商圈/板块
  avgPrice: 85200,                     // 均价（元/㎡）— 数值，可排序/筛选
  priceRange: "640万 - 1,280万",        // 总价区间（展示用字符串）
  priceTrend: "up",                    // 价格趋势: up | down | stable
  priceChange: "+3.2%",               // 涨跌幅（展示用字符串）
  priceChangePct: 3.2,                // 涨跌幅（数值，用于排序/筛选）
  buildYear: 2008,                     // 建成年份
  propertyType: "普通住宅",             // 物业类型
  developer: "万科集团",                // 开发商
  propertyMgmt: "万科物业",             // 物业公司
  propertyFee: "3.8元/㎡/月",           // 物业费（展示用字符串）
  propertyFeeValue: 3.8,              // 物业费（数值，元/㎡/月）
  greenRate: "35%",                    // 绿化率（展示用字符串）
  greenRatePct: 35,                    // 绿化率（数值，用于排序）
  plotRatio: 2.5,                      // 容积率
  totalUnits: 1800,                    // 总户数
  nearbyMetro: [                       // 附近地铁
    "5号线 北苑路北站",
    "13号线 北苑站"
  ],
  distanceToMetro: "约800m",           // 最近地铁站距离（展示用字符串）
  distanceToMetroMeters: 800,          // 最近地铁站距离（数值，米）
  location: {                          // 经纬度（用于地图+通勤计算）
    lat: 40.0285,
    lng: 116.4098
  },
  // --- 看房关注等级（非投资建议） ---
  attentionLevel: "high",              // 看房关注等级: high | medium | low
  attentionText: "看房优先级高",        // 关注等级文案
  attentionReason: "品牌开发商+自持物业...", // 关注理由
  scoreDetails: {                      // 评分明细（解释为什么推荐/不推荐）
    locationScore: 8,
    qualityScore: 9,
    valueScore: 6,
    growthScore: 7
  },
  ruleVersion: "v1.0",                // 评分规则版本号
  evidenceSources: ["manual", "amap"], // 评分依据的数据来源
  highlights: [                        // 核心优势（3-5条）
    "万科品牌物业，社区管理规范",
    "双地铁覆盖（5号线+13号线）"
  ],
  risks: [                             // 风险提醒（3-5条）
    "单价高于北苑板块均价约15%",
    "部分户型临北苑路，低楼层有噪音"
  ],
  listingCount: 23,                    // 在售房源数
  avgDaysOnMarket: 45,                 // 平均成交周期（天）
  monthlyTransactions: 8,              // 月成交量
  alternatives: [                      // 替代小区（对象数组，NoSQL数据冗余）
    { "id": "yuanfangyifang", "name": "远洋一方", "avgPrice": 48600 },
    { "id": "rongzejiayuan", "name": "融泽嘉园", "avgPrice": 62800 },
    { "id": "shoukaiguofeng", "name": "首开国风美唐", "avgPrice": 58200 }
  ],
  searchKeywords: [                    // 搜索关键词；数据量 < 1万条时，
                                       // 搜索建议（Suggestions）优先在前端
    "万科星园", "万科", "星园", "北苑", "朝阳",  // 通过 localStorage 缓存的小区精简列表
    "5号线", "北苑路北", "13号线"              // 纯 JS 计算，无需调云函数
  ],
  // --- 数据来源与可信度（重要） ---
  sourceInfo: {
    provider: "manual",                // 数据来源: manual | amap | beike | juhe | gov | other
    sourceUrl: "",                     // 原始数据 URL（如有）
    licenseType: "manual",            // 授权类型: manual | authorized_api | public_data
    fetchedAt: "2026-06-20T08:00:00Z", // 数据抓取时间
    confidence: 0.85                   // 数据可信度 (0-1)，手动录入=1.0，API数据=0.7-0.9
  },
  dataUpdatedAt: "2026-06-22T10:00:00Z", // 数据更新时间
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-22T10:00:00Z"
}
```

> **设计说明**：每个展示用的字符串字段（如 `propertyFee`、`greenRate`、`distanceToMetro`、`priceChange`）都配有一个对应的数值字段（如 `propertyFeeValue`、`greenRatePct`、`distanceToMetroMeters`、`priceChangePct`），方便后期做排序、筛选和范围查询。展示用字符串，计算用数值。

#### `transactions` — 成交记录

```javascript
{
  _id: "auto_generated",               // 自动生成
  communityId: "wankeyuan",            // 关联小区
  communityName: "万科星园",           // 冗余字段（加速查询展示）
  date: "2026-06",                     // 成交月份
  size: "89㎡ 两室两厅",               // 户型面积
  floor: "12/18层",                    // 楼层
  price: 758,                          // 成交总价（万元）
  unitPrice: 85168,                    // 成交单价（元/㎡）
  direction: "南北通透",               // 朝向
  dataSource: "api",                   // 数据来源
  createdAt: "2026-06-20T08:00:00Z"
}
```

#### `users` — 用户信息

```javascript
{
  _id: "auto_generated",               // 自动生成
  uid: "cloudbase_user_xxx",           // CloudBase 认证 uid
  phone: "138****1234",               // 手机号（脱敏存储）
  nickname: "用户昵称",                 // 昵称
  avatar: "",                          // 头像 URL
  city: "北京",                         // 关注城市
  createdAt: "2026-06-01T00:00:00Z",
  lastLoginAt: "2026-06-23T14:00:00Z"
}
```

#### `favorites` — 用户收藏

```javascript
{
  _id: "auto_generated",
  userId: "cloudbase_user_xxx",        // 用户 uid
  communityId: "wankeyuan",            // 收藏的小区
  communityName: "万科星园",           // 冗余字段
  district: "朝阳区",                  // 冗余字段
  avgPrice: 85200,                     // 收藏时的均价（快照）
  createdAt: "2026-06-15T08:00:00Z"
}
```

#### `subscriptions` — 用户订阅

```javascript
{
  _id: "auto_generated",
  userId: "cloudbase_user_xxx",        // 用户 uid
  communityId: "wankeyuan",            // 订阅的小区
  type: ["price_change", "new_listing"], // 订阅类型: price_change | new_listing | transaction
  createdAt: "2026-06-15T08:00:00Z",
  lastNotifiedAt: "2026-06-20T10:00:00Z"
}
```

#### `notifications` — 通知记录

```javascript
{
  _id: "auto_generated",
  userId: "cloudbase_user_xxx",
  communityId: "wankeyuan",
  communityName: "万科星园",
  type: "price_change",                // 通知类型
  title: "万科星园均价上涨 3.2%",
  content: "当前均价 8.52万/㎡，较上月上涨 3.2%",
  read: false,                         // 是否已读
  createdAt: "2026-06-22T10:00:00Z"
}
```

#### `search_history` — 搜索历史

```javascript
{
  _id: "auto_generated",
  userId: "cloudbase_user_xxx",        // 匿名用户可用设备 ID
  keyword: "万科星园",                  // 搜索关键词
  city: "北京",                         // 搜索城市
  createdAt: "2026-06-23T14:00:00Z",
  expireAt: "2026-07-23T14:00:00Z"     // 过期时间（30天后自动删除）
}
```

> **隐私保护**：搜索历史包含用户关注区域、预算、购房意图等敏感行为数据，默认保留 30 天，提供"清空历史"按钮。通过在 CloudBase 中设置 TTL 索引（`expireAt`）实现自动过期删除。

#### `data_sync_jobs` — 数据同步任务

```javascript
{
  _id: "auto_generated",
  communityId: "wankeyuan",            // 需要刷新数据的小区
  status: "pending",                   // 状态: pending | running | success | failed
  lockedUntil: "2026-06-22T10:10:00Z", // 锁过期时间（防重复触发）
  retryCount: 0,                       // 重试次数
  maxRetries: 3,                       // 最大重试次数
  lastError: "",                       // 最后一次错误信息
  createdAt: "2026-06-22T10:00:00Z",
  updatedAt: "2026-06-22T10:00:00Z"
}
```

> **用途**：配合"按需触发"更新机制，实现可靠的异步刷新队列。云函数在执行前检查 `lockedUntil` 防止重复触发，执行后更新 `status` 和 `retryCount`。

#### `feedbacks` — 用户反馈与纠错

```javascript
{
  _id: "auto_generated",
  userId: "cloudbase_user_xxx",        // 反馈用户
  communityId: "wankeyuan",            // 相关小区（可选）
  type: "data_error",                  // 类型: data_error | suggestion | complaint
  content: "小区均价应该是8.3万而不是8.5万", // 反馈内容
  status: "open",                      // 状态: open | resolved | ignored
  adminNote: "",                       // 管理员备注
  createdAt: "2026-06-23T14:00:00Z",
  resolvedAt: ""
}
```

> **用途**：每个小区详情页展示"纠错反馈"入口，用户可提交数据纠错。管理员审核后更新小区数据，`status` 改为 `resolved`。同时标记在 `sourceInfo.confidence` 中，当反馈较多时降低可信度。

### 3.3 索引设计

```javascript
// communities 集合索引
db.communities.createIndex({ "city": 1, "district": 1 })
db.communities.createIndex({ "avgPrice": 1 })
db.communities.createIndex({ "dataUpdatedAt": -1 })

// transactions 集合索引
db.transactions.createIndex({ "communityId": 1, "date": -1 })
db.transactions.createIndex({ "date": -1 })

// favorites 集合索引
db.favorites.createIndex({ "userId": 1, "createdAt": -1 })
db.favorites.createIndex({ "userId": 1, "communityId": 1 }, { unique: true })

// subscriptions 集合索引
db.subscriptions.createIndex({ "userId": 1 })
db.subscriptions.createIndex({ "communityId": 1 })

// notifications 集合索引
db.notifications.createIndex({ "userId": 1, "read": 1, "createdAt": -1 })

// search_history 集合索引
db.search_history.createIndex({ "userId": 1, "createdAt": -1 })
db.search_history.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 0 })  // TTL 索引，自动过期

// data_sync_jobs 集合索引
db.data_sync_jobs.createIndex({ "communityId": 1, "status": 1 })
db.data_sync_jobs.createIndex({ "lockedUntil": 1 })

// feedbacks 集合索引
db.feedbacks.createIndex({ "communityId": 1, "status": 1 })
db.feedbacks.createIndex({ "userId": 1, "createdAt": -1 })
```

---

## 4. API 接口清单

> **MVP 调用方式**：使用 CloudBase SDK 的 `callFunction` 方式调用云函数，无需配置 HTTP 网关、路由、CORS 和自定义域名。前端直接通过 SDK 调用云函数，CloudBase 自动处理鉴权。
>
> ```js
> // 前端调用示例
> import cloudbase from '@cloudbase/js-sdk';
> const app = cloudbase.init({ env: 'your-env-id' });
>
> // 搜索小区
> const res = await app.callFunction({
>   name: 'communities',
>   data: { action: 'search', keyword: '万科', city: '北京' }
> });
> ```
>
> **后期演进**：产品跑通后，可将高频接口迁到 CloudBase HTTP 网关，获得 RESTful URL 和自定义域名。

### 4.1 小区相关（云函数：`communities`）

#### `action: "search"` — 小区列表搜索

```
请求参数:
  keyword:  string   // 搜索关键词（小区名/板块/地铁站）
  city:     string   // 城市（默认"北京"）
  district: string   // 行政区（可选，筛选）
  page:     number   // 页码（默认1）
  pageSize: number   // 每页条数（默认20，最大50）

响应:
{
  code: 0,
  data: {
    list: [ Community ],    // 小区列表
    total: 128,             // 总条数
    page: 1,
    pageSize: 20
  }
}
```

#### `action: "detail"` — 小区详情

```
响应:
{
  code: 0,
  data: Community   // 完整小区信息（含highlight、risks、alternatives）
}
```

#### `action: "transactions"` — 小区成交记录

```
请求参数:
  page:     number   // 页码
  pageSize: number   // 每页条数（默认10）

响应:
{
  code: 0,
  data: {
    list: [ Transaction ],
    total: 45
  }
}
```

#### `action: "alternatives"` — 替代小区推荐

```
响应:
{
  code: 0,
  data: [ Community ]   // 3-5个替代小区
}
```

#### `action: "hot"` — 热门小区

```
请求参数:
  city:     string   // 城市
  limit:    number   // 数量（默认6）

响应:
{
  code: 0,
  data: [ Community ]
}
```

#### `action: "compare"` — 多小区对比

```
请求参数:
  ids: string   // 逗号分隔的小区ID，如 "id1,id2,id3"（最多4个）

响应:
{
  code: 0,
  data: [ Community ]   // 含完整对比维度
}
```

### 4.2 用户相关（云函数：`users`）

#### `action: "add-favorite"` — 收藏小区

```
请求体:
{
  communityId: "wankeyuan"
}

响应:
{
  code: 0,
  data: { favorited: true }
}
```

#### `action: "remove-favorite"` — 取消收藏

```
响应:
{
  code: 0,
  data: { favorited: false }
}
```

#### `action: "get-favorites"` — 收藏列表

```
响应:
{
  code: 0,
  data: [ Community ]   // 收藏的小区详情列表
}
```

#### `action: "subscribe"` — 订阅小区

```
请求体:
{
  communityId: "wankeyuan",
  type: ["price_change", "new_listing"]   // 订阅类型
}

响应:
{
  code: 0,
  data: { subscribed: true }
}
```

#### `action: "unsubscribe"` — 取消订阅

```
响应:
{
  code: 0,
  data: { subscribed: false }
}
```

#### `action: "get-subscriptions"` — 订阅列表

```
响应:
{
  code: 0,
  data: [ Subscription ]
}
```

#### `action: "get-notifications"` — 通知列表

```
请求参数:
  page:     number
  pageSize: number

响应:
{
  code: 0,
  data: {
    list: [ Notification ],
    unreadCount: 3,
    total: 25
  }
}
```

#### `action: "mark-read"` — 标记通知已读

```
响应:
{
  code: 0
}
```

### 4.3 辅助接口

#### `action: "suggestions"` — 搜索建议（自动补全）

> **优化策略**：当小区总量在 1 万条以内时，建议采用**前端优先方案**，无需调用云函数，响应更快且零资源消耗。

**前端优先方案（推荐，初期使用）** ：

1. 首屏加载时，调用一次轻量 API 拉取所有小区的 `{ id, name, district, avgPrice }` 精简列表（约 200KB，gzip 后约 50KB）
2. 将精简列表缓存到 `localStorage`，设置 24 小时过期
3. 用户输入时，直接用纯 JS 在前端做 `Array.filter()` 模糊匹配，300ms 内即可出结果
4. 优势：**不需要云函数、不需要数据库查询、不需要网络请求**，极快且极省资源

```
// 前端搜索建议伪代码
const cache = JSON.parse(localStorage.getItem('community_list') || '[]');
const suggestions = cache
  .filter(c => c.name.includes(keyword) || c.district.includes(keyword))
  .slice(0, 8);
```

**云函数方案（兜底，数据量 > 1万条时启用）** ：

```
请求参数:
  keyword: string   // 输入的关键词

响应:
{
  code: 0,
  data: [ "万科星园", "万科城市花园", "万科金域华府", "北苑", "万科" ]
}
```

#### `action: "get-checklist"` — 看房清单

```
响应:
{
  code: 0,
  data: [
    {
      id: "c1",
      category: "产权",
      question: "房产证是否满五唯一？有无抵押/查封？",
      important: true
    },
    // ... 共12-15条
  ]
}
```

#### `action: "check-item"` — 标记清单已确认

```
请求体:
{
  checked: true
}

响应:
{
  code: 0
}
```

### 4.4 数据更新机制（按需触发 + 任务队列）

> **弃用定时任务**：不再使用 Cron 定时全量拉取数据，改为**按需触发 + 惰性更新**策略，大幅降低 API 调用次数和成本。

**触发逻辑**：

```
用户访问小区详情页
        │
        ▼
检查 dataUpdatedAt 字段
        │
   ┌────┴────┐
   │  < 7天   │  ──▶  直接返回缓存数据，不触发更新
   └─────────┘
        │
   ┌────┴────┐
   │  ≥ 7天   │  ──▶  先返回旧数据，前端渲染完成后，
   └─────────┘         fire-and-forget 调用刷新云函数
```

**两步实现（MVP 可靠做法）** ：

**步骤 1：前端 fire-and-forget 调用**

```js
// 在详情页渲染完成后，异步触发刷新（不阻塞页面）
const detail = await app.callFunction({
  name: 'communities',
  data: { action: 'detail', communityId: 'wankeyuan' }
});
// 渲染详情页...

// 如果数据过期，fire-and-forget 触发刷新
if (detail.data.needsRefresh) {
  app.callFunction({
    name: 'dataSync',
    data: { action: 'refresh', communityId: 'wankeyuan' }
  }).catch(() => {}); // 忽略错误，不影响用户体验
}
```

**步骤 2：云函数 `dataSync` — `action: "refresh"`**

```
请求参数:
  communityId: "wankeyuan"   // 需要刷新数据的小区

云函数执行流程:
  1. 检查 data_sync_jobs 集合中是否存在该小区的 pending/running 任务
  2. 如果 lockedUntil > 当前时间 → 跳过（10分钟内已触发过）
  3. 如果无锁 → 插入一条 pending 任务，设置 lockedUntil = now + 10min
  4. 从外部数据源拉取最新价格、成交记录
  5. 写入 communities 和 transactions 集合
  6. 更新 dataUpdatedAt 字段
  7. 更新任务状态为 success，检查用户订阅并生成通知
  8. 如果失败 → 状态改为 failed，retryCount + 1
```

**优势**：

| 对比维度     | 定时任务（旧方案）            | 按需触发 + 任务队列（新方案）         |
| ------------ | ----------------------------- | ------------------------------------- |
| API 调用次数 | 每6小时全量，无论有无用户访问 | 仅更新用户实际访问的过期小区          |
| 成本         | 固定消耗（约 300-1000 次/天） | 按实际访问量（初期可能 < 10 次/天）   |
| 可靠性       | 单个云函数执行，失败无重试    | 任务队列 + 重试机制 + 状态追踪        |
| 数据新鲜度   | 最多滞后 6 小时               | 热门小区实时更新，冷门小区保持旧数据  |
| 防重复       | 无                            | `data_sync_jobs.lockedUntil` 锁定机制 |

**反馈接口**：

#### `action: "submit-feedback"` — 提交数据纠错

```
请求参数:
  communityId: "wankeyuan",
  type: "data_error",
  content: "小区均价应该是8.3万而不是8.5万"

响应:
{
  code: 0,
  data: { feedbackId: "xxx" }
}
```

---

## 5. 项目目录结构

> **设计原则**：MVP 阶段尽量减少抽象层，不要拆太细。前端只分 `pages/`、`components/`、`services/`，云函数 2-3 个即可。

```
house-assistant/
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
│
├── public/                           # 静态资源
│   └── favicon.svg
│
├── .env.example                      # 环境变量模板（不含真实Key，可提交Git）
├── cloudbaserc.json                  # CloudBase 部署配置
│
├── src/                              # 前端源码
│   ├── main.jsx                      # 入口
│   ├── App.jsx                       # 根组件
│   ├── pages/                        # 页面
│   │   ├── HomePage.jsx              # 首页
│   │   ├── DetailPage.jsx            # 小区详情
│   │   ├── ComparePage.jsx           # 对比页
│   │   ├── FavoritesPage.jsx         # 收藏页
│   │   └── ChecklistPage.jsx         # 看房清单
│   ├── components/                   # 通用组件
│   │   ├── SearchBar.jsx             # 搜索栏
│   │   ├── CommunityCard.jsx         # 小区卡片
│   │   └── PriceChart.jsx            # 价格走势图
│   ├── services/
│   │   └── cloudbase.js             # CloudBase SDK 初始化
│   └── utils/
│       ├── formatter.js              # 价格/数字格式化
│       └── storage.js                # localStorage 封装
│
└── cloudfunctions/                   # 云函数（2-3个即可）
    ├── communities/                   # 小区相关
    │   ├── index.js
    │   └── package.json
    ├── users/                         # 用户相关
    │   ├── index.js
    │   └── package.json
    └── dataSync/                      # 数据同步
        ├── index.js
        └── package.json
```

> **与旧版的区别**：去掉了 `services/` 下的诸多子目录（search.js、compare.js 等）、去掉了 `common/` 公共模块，因为 MVP 阶段每个云函数体量很小，不需要过度抽象。云函数从 4 个合并为 3 个：`communities`（小区搜索/详情/对比）、`users`（收藏/订阅/通知）、`dataSync`（数据刷新/通知检查）。

---

## 6. 风险评估

### 6.1 技术风险

| 风险                    | 等级 | 说明                                    | 应对策略                                                                           |
| ----------------------- | ---- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| **CloudBase 停服/涨价** | 低   | 腾讯云核心产品，稳定性高                | 核心代码不使用 CloudBase 私有 API，保持迁移到其他云平台的能力                      |
| **NoSQL 复杂查询受限**  | 中   | 文档数据库不支持 JOIN、复杂聚合         | 设计时做数据冗余（如收藏表中冗余小区名），用云函数做"应用层 JOIN"                  |
| **云函数冷启动**        | 低   | 长时间不调用后首次响应慢 200-500ms      | MVP 阶段接受冷启动，用前端 loading 和缓存解决，不做保温                            |
| **数据源稳定性**        | 高   | 房产数据 API 可能涨价、断供、数据不准确 | 1. MVP 阶段用 Mock 数据起步 2. 数据标注"更新时间"和"可信度" 3. 储备2-3个备用数据源 |
| **微信小程序审核**      | 中   | 房产类小程序审核较严，可能被拒          | 先做纯网页版上线验证，小程序作为后续扩展                                           |

### 6.2 业务风险

| 风险               | 等级 | 说明                                 | 应对策略                                                                       |
| ------------------ | ---- | ------------------------------------ | ------------------------------------------------------------------------------ |
| **数据合规性**     | 高   | 房产数据来源及授权不明确存在法律风险 | 1. 优先使用 Mock/手工数据 2. 真实数据 API 必须先确认授权 3. 不直接爬取竞品平台 |
| **数据准确性纠纷** | 中   | 用户可能因数据不准产生投诉           | 每页标注"数据更新时间"和"仅供参考"；增加"纠错反馈"入口                         |
| **竞品模仿**       | 低   | 头部平台（贝壳、安居客）可能跟进     | 聚焦"轻决策"差异化体验，不做全量房源，形成细分心智                             |
| **用户留存**       | 中   | 买房是低频需求，用户用完即走         | 通过订阅提醒、收藏列表建立"回访钩子"；内容运营（板块分析文章）                 |

### 6.3 成本风险（参考：见第2章三层成本模型）

| 层级             | 成本范围     | 核心风险                                                  |
| ---------------- | ------------ | --------------------------------------------------------- |
| **MVP 验证**     | ¥0/月        | 无，Mock 数据不产生任何费用                               |
| **小流量内测**   | ¥0-100/月    | 需设置预算告警，防止意外超支                              |
| **真实数据接入** | ¥300-1500/月 | 房产数据 API 是**一号成本风险**，需先确认授权和价格再接入 |

### 6.4 给独立开发者的实操建议

1. **MVP 阶段先用静态 Mock 数据上线**：原型中的 Mock 数据可以直接用，先验证产品体验，再接入真实数据源。这能让你在**零成本**下快速验证想法。

2. **CloudBase 环境用"按量计费"而非"包年包月"**：初期流量小，按量计费基本不花钱。在控制台设置**预算上限 + 余额告警**，防止意外超支。

3. **云函数不要拆太细**：初期 `communities` 一个函数处理所有小区相关，`users` 一个函数处理用户相关，`dataSync` 一个处理数据同步。拆太细反而不利于理解和调试。

4. **先不做小程序**：小程序的审核、支付、资质要求比网页高很多。先用网页版跑通核心流程，再考虑小程序。

5. **匿名浏览优先**：V0.1 阶段不强制登录，用户搜小区、看详情不需要注册。只在收藏、订阅时提示登录。大幅降低用户流失率。

6. **数据更新用"按需触发"而非"定时全量"**：当用户访问某个超过 7 天未更新数据的小区时，才 fire-and-forget 触发一次更新。利用 `data_sync_jobs` 集合做防重复和重试。初期可能每天只需个位数的更新次数，几乎零成本。

7. **生产环境 Key 只用控制台配置**：不要把 API Key 写入 `cloudbaserc.json` 并提交到 Git。仓库只放 `.env.example` 模板。

---

## 7. 合规与免责声明

本项目涉及房价、成交、小区评价、购房决策，必须补充合规要求。

### 7.1 数据来源声明

每个小区详情页必须展示数据来源信息（基于 `sourceInfo` 字段）：

```
数据来源：手工录入 | 更新时间：2026-06-22 | 可信度：85% | 仅供参考，不构成购房建议
```

### 7.2 产品表达规范

| 旧表达     | 新表达           | 原因                           |
| ---------- | ---------------- | ------------------------------ |
| "可去看"   | "看房优先级高"   | 避免构成投资/购房建议          |
| "谨慎"     | "看房需关注风险" | 强调风险提醒，而非否定性判断   |
| "暂不建议" | "看房优先级低"   | 不以建议形式表达，用优先级代替 |
| "推荐"     | "综合评分高"     | 避免推荐表述，改用客观评分     |

### 7.3 隐私保护

| 数据类型 | 保留策略             | 用户控制                           |
| -------- | -------------------- | ---------------------------------- |
| 搜索历史 | 30 天自动过期（TTL） | 提供"清空历史"按钮                 |
| 收藏列表 | 用户主动删除         | 每个小区卡片上有取消收藏按钮       |
| 订阅列表 | 用户主动取消         | 每个订阅上有取消按钮               |
| 通知记录 | 90 天自动过期        | 提供"删除通知"按钮                 |
| 纠错反馈 | 永久保留（脱敏）     | 提交后不可撤回（用于数据质量改进） |

### 7.4 第三方数据合规

1. 所有房产数据必须来自：授权 API、公开政府数据、或人工录入
2. 严禁直接爬取竞品平台（贝壳、安居客等）数据
3. 高德地图 API 使用需遵守高德开放平台服务协议
4. V0.1 阶段不做大模型问答，避免生成式 AI 服务合规风险

---

## 8. 分阶段落地计划

> 定位：V0.1 不追求"真实全量房产数据平台"，而是做一个**低成本、低运维、半静态数据驱动的看房决策助手**。先用 Mock/手工数据验证产品体验，后续再通过授权 API 接入真实数据。

| 阶段 | 目标                      | 技术动作                                                                   | 成本    |
| ---- | ------------------------- | -------------------------------------------------------------------------- | ------- |
| 一   | **静态 Mock 数据上线**    | React + CloudBase 静态托管，所有数据来自前端 Mock 文件，零后端调用         | ¥0      |
| 二   | **接入 CloudBase 数据库** | 将 Mock 数据导入 CloudBase 文档数据库，支持搜索、详情、收藏、订阅          | ¥0      |
| 三   | **接入高德地图**          | 通勤时间、地铁距离、周边配套，通过云函数代理调用，做好服务端缓存和请求去重 | ¥0-30   |
| 四   | **接入真实房产数据**      | 先确认 API 授权、价格、字段、调用限制，再通过适配层接入，数据源可随时切换  | 见第2章 |
| 五   | **扩展与优化**            | 小程序（Taro）、AI 智能解读、推荐算法、复杂筛选排序                        | 视规模  |

---

## 附录：关键文档链接

- [PRD 文档](./house-assistant-prd.html)
- [原型演示](../Prototype/)
- [启动指南](./Start.md)
- [腾讯云 CloudBase 文档](https://docs.cloudbase.net/)
- [高德地图 Web API 文档](https://lbs.amap.com/api/webservice/summary)
- [高德地图服务升级与配额](https://lbs.amap.com/upgrade)
- [腾讯云 CloudBase 计费文档](https://cloud.tencent.com/document/product/876/127357)
- [贝壳开放平台](https://open.ke.com/)

---

*本文档由豪斯助手 CTO 团队出具，面向独立开发者。技术选型优先考虑：零运维 > 成本低 > 上手简单 > 性能。V0.1 定位：Web 优先、匿名优先、Mock 数据优先、授权数据源后置。*