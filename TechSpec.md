# 豪斯助手（House Assistant）技术规格说明书

> **版本**: V0.1 | **日期**: 2026-06-23 | **角色**: 面向独立开发者的零运维技术方案

---

## 1. 核心架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户浏览器 / 微信小程序                       │
│                    (React SPA / Taro 跨端小程序)                       │
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
│  │  • 自动部署   │  │  • 定时任务   │  │  • favorites            │  │
│  │              │  │  • 通知推送   │  │  • transactions         │  │
│  └──────────────┘  └──────────────┘  │  • subscriptions         │  │
│                                       └──────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      云开发 身份认证                            │   │
│  │          • 手机号验证码登录  • 微信登录  • 匿名登录              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 定时触发 / 数据源
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
└─────────────────────────────────────────────────────────────────────┘
```

**架构说明（给非技术人员的通俗解释）** ：

- **你的网站**（前端）放在腾讯云 CDN 上，用户访问速度飞快，且你不需要管服务器
- **后端逻辑**是一小段一小段的"云函数"，只在被调用时才运行，不调用不花钱
- **数据库**是腾讯云帮你管好的文档数据库，不需要你安装、配置、备份
- **用户登录**直接用手机号验证码，腾讯云帮你搞定，不需要自己写登录系统
- **外部数据**通过购买数据 API 定时拉取，用云函数的定时触发器自动更新

---

## 2. 技术栈推荐

### 方案总览

| 层级 | 技术选型 | 为什么选它 | 免费额度 |
|------|---------|-----------|---------|
| **前端框架** | React 18 + Vite | 已在原型中验证；生态最大、中文教程最多 | 免费 |
| **UI 样式** | Tailwind CSS 3 | 原子化 CSS，改样式不用写 CSS 文件 | 免费 |
| **图标库** | Lucide React | 轻量、美观、开箱即用 | 免费 |
| **BaaS 平台** | **腾讯云 CloudBase（云开发）** | 国内最成熟的 Serverless 平台，零运维 | 见下方 |
| **数据库** | CloudBase 云数据库（文档型 NoSQL） | 免运维、自动扩容、与云函数天然集成 | 2GB 免费 |
| **后端逻辑** | CloudBase 云函数（Node.js 18） | 按调用次数计费，不调用不花钱 | 100万次/月免费 |
| **静态托管** | CloudBase 静态网站托管 | 国内 CDN 加速，自带 HTTPS 证书 | 5GB 存储 + 5GB 流量/月 |
| **身份认证** | CloudBase 认证（手机号） | 一行代码接入登录，无需自己写 | 1万次/月免费 |
| **地图服务** | 高德地图 Web API | 国内最稳定，免费额度充足 | 5000次/天免费 |
| **数据源** | 聚合数据 / 贝壳开放平台 | 提供标准化房产数据 | 视供应商而定 |

### CloudBase 免费额度明细

| 资源 | 免费额度 | 够不够用？ |
|------|---------|-----------|
| 云数据库存储 | 2GB | 初期够用（约存 10万+ 条小区数据） |
| 云数据库读操作 | 5万次/天 | 日均 5000 UV 够用 |
| 云函数调用 | 100万次/月 | 够用（每次搜索/访问详情页约 1-2 次调用） |
| 静态托管存储 | 5GB | 远超需求（前端打包后通常 < 2MB） |
| 静态托管流量 | 5GB/月 | 日均 3000 PV 够用 |
| 身份认证 | 1万次/月 | 初期够用 |

### 为什么不选其他方案？

| 方案 | 不推荐原因 |
|------|-----------|
| **Supabase** | 服务器在海外，国内访问慢；中文文档少 |
| **Firebase** | Google 服务，国内完全不可用 |
| **Vercel + 自建后端** | Vercel 在国内访问不稳定；需要单独部署后端 |
| **阿里云 FC + 自建数据库** | 需要分别配置多个服务，运维复杂度高 |
| **传统云服务器（ECS）** | 需要自己装系统、配环境、设防火墙、做备份，运维负担重 |
| **LeanCloud** | 被字节收购后发展停滞，社区活跃度下降 |

### 小程序扩展（可选）

如果未来需要小程序版本，推荐使用 **Taro 3** 框架，一套 React 代码可以编译到微信小程序，与 Web 端共享 80% 以上的业务逻辑。

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
└── search_history        # 搜索历史
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
  avgPrice: 85200,                     // 均价（元/㎡）
  priceRange: "640万 - 1,280万",        // 总价区间（展示用）
  priceTrend: "up",                    // 价格趋势: up | down | stable
  priceChange: "+3.2%",               // 涨跌幅（展示用）
  buildYear: 2008,                     // 建成年份
  propertyType: "普通住宅",             // 物业类型
  developer: "万科集团",                // 开发商
  propertyMgmt: "万科物业",             // 物业公司
  propertyFee: "3.8元/㎡/月",           // 物业费
  greenRate: "35%",                    // 绿化率
  plotRatio: 2.5,                      // 容积率
  totalUnits: 1800,                    // 总户数
  nearbyMetro: [                       // 附近地铁
    "5号线 北苑路北站",
    "13号线 北苑站"
  ],
  distanceToMetro: "约800m",           // 最近地铁站距离
  location: {                          // 经纬度（用于地图+通勤计算）
    lat: 40.0285,
    lng: 116.4098
  },
  verdict: "recommend",                // 综合判断: recommend | cautious | avoid
  verdictText: "可去看",               // 判断文案
  verdictReason: "品牌开发商+自持物业...", // 判断理由
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
  alternatives: [                      // 替代小区 ID 列表
    "yuanfangyifang",
    "rongzejiayuan"
  ],
  searchKeywords: [                    // 搜索关键词（用于模糊搜索）
    "万科星园", "万科", "星园", "北苑", "朝阳",
    "5号线", "北苑路北", "13号线"
  ],
  dataSource: "api",                   // 数据来源: api | manual | crawl
  dataUpdatedAt: "2026-06-22T10:00:00Z", // 数据更新时间
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-22T10:00:00Z"
}
```

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
  createdAt: "2026-06-23T14:00:00Z"
}
```

### 3.3 索引设计

```javascript
// communities 集合索引
db.communities.createIndex({ "city": 1, "district": 1 })
db.communities.createIndex({ "searchKeywords": 1 })
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
```

---

## 4. API 接口清单

> **Base URL**: 云函数环境自带，无需配置域名。  
> **认证方式**: 请求头携带 `Authorization: Bearer <cloudbase_token>`（CloudBase SDK 自动处理）。

### 4.1 小区相关

#### `GET /api/communities` — 小区列表搜索

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

#### `GET /api/communities/:id` — 小区详情

```
响应:
{
  code: 0,
  data: Community   // 完整小区信息（含highlight、risks、alternatives）
}
```

#### `GET /api/communities/:id/transactions` — 小区成交记录

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

#### `GET /api/communities/:id/alternatives` — 替代小区推荐

```
响应:
{
  code: 0,
  data: [ Community ]   // 3-5个替代小区
}
```

#### `GET /api/communities/hot` — 热门小区

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

#### `GET /api/communities/compare` — 多小区对比

```
请求参数:
  ids: string   // 逗号分隔的小区ID，如 "id1,id2,id3"（最多4个）

响应:
{
  code: 0,
  data: [ Community ]   // 含完整对比维度
}
```

### 4.2 用户相关

#### `POST /api/users/favorites` — 收藏小区

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

#### `DELETE /api/users/favorites/:communityId` — 取消收藏

```
响应:
{
  code: 0,
  data: { favorited: false }
}
```

#### `GET /api/users/favorites` — 收藏列表

```
响应:
{
  code: 0,
  data: [ Community ]   // 收藏的小区详情列表
}
```

#### `POST /api/users/subscriptions` — 订阅小区

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

#### `DELETE /api/users/subscriptions/:communityId` — 取消订阅

```
响应:
{
  code: 0,
  data: { subscribed: false }
}
```

#### `GET /api/users/subscriptions` — 订阅列表

```
响应:
{
  code: 0,
  data: [ Subscription ]
}
```

#### `GET /api/users/notifications` — 通知列表

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

#### `PUT /api/users/notifications/:id/read` — 标记通知已读

```
响应:
{
  code: 0
}
```

### 4.3 辅助接口

#### `GET /api/suggestions` — 搜索建议（自动补全）

```
请求参数:
  keyword: string   // 输入的关键词

响应:
{
  code: 0,
  data: [ "万科星园", "万科城市花园", "万科金域华府", "北苑", "万科" ]
}
```

#### `GET /api/checklist` — 看房清单

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

#### `POST /api/checklist/:id/check` — 标记清单已确认

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

### 4.4 定时任务（云函数触发器）

```
触发方式: 定时触发器（Cron）

// 每6小时执行一次
GET /api/cron/update-prices
  功能: 从数据源拉取最新价格数据，更新 communities 和 transactions

// 每天凌晨2点执行
GET /api/cron/check-subscriptions
  功能: 检查订阅，对比价格变化，生成 notifications
```

---

## 5. 项目目录结构

```
house-assistant/
├── README.md                         # 项目说明
├── package.json                      # 依赖管理
├── vite.config.js                    # Vite 构建配置
├── tailwind.config.js                # Tailwind 主题
├── postcss.config.js
├── index.html                        # HTML 入口
│
├── public/                           # 静态资源（不经过构建）
│   ├── favicon.svg
│   └── og-image.png                  # 社交分享图
│
├── cloudbaserc.json                  # CloudBase 部署配置（核心！）
│                                     # 包含环境ID、函数配置、数据库权限
│
├── src/                              # 前端源码
│   ├── main.jsx                      # 应用入口
│   ├── App.jsx                       # 根组件 + 路由
│   ├── index.css                     # 全局样式
│   │
│   ├── config/
│   │   └── cloudbase.js              # CloudBase SDK 初始化配置
│   │
│   ├── hooks/
│   │   ├── useAuth.js                # 登录状态 Hook
│   │   ├── useCommunities.js         # 小区数据 Hook
│   │   ├── useFavorites.js           # 收藏 Hook
│   │   └── useSearch.js              # 搜索逻辑 Hook
│   │
│   ├── services/
│   │   └── api.js                    # 云函数调用封装（统一管理所有 API 请求）
│   │
│   ├── components/                   # 通用组件
│   │   ├── Header.jsx                # 顶部导航
│   │   ├── SearchBar.jsx             # 搜索框（含自动补全）
│   │   ├── CommunityCard.jsx         # 小区卡片
│   │   ├── ComparisonTable.jsx       # 对比表格
│   │   ├── VerdictBadge.jsx          # 判断标签（可去看/谨慎/暂不建议）
│   │   ├── PriceTrend.jsx            # 价格趋势图
│   │   └── Loading.jsx               # 加载状态
│   │
│   ├── pages/                        # 页面
│   │   ├── HomePage.jsx              # 首页
│   │   ├── DetailPage.jsx            # 小区详情（决策卡）
│   │   ├── ComparePage.jsx           # 对比页
│   │   ├── FavoritesPage.jsx         # 收藏页
│   │   ├── ChecklistPage.jsx         # 看房清单
│   │   ├── NotificationsPage.jsx     # 通知中心
│   │   └── LoginPage.jsx             # 登录页
│   │
│   └── utils/                        # 工具函数
│       ├── formatter.js              # 价格/数字格式化
│       └── storage.js                # 本地存储封装
│
└── cloudfunctions/                   # 云函数（后端逻辑）
    ├── communities/                   # 小区相关
    │   ├── index.js                   # 云函数入口
    │   ├── package.json
    │   └── services/
    │       ├── search.js              # 搜索逻辑
    │       └── compare.js             # 对比逻辑
    │
    ├── users/                         # 用户相关
    │   ├── index.js
    │   └── services/
    │       ├── favorites.js           # 收藏管理
    │       └── subscriptions.js       # 订阅管理
    │
    ├── data-sync/                     # 数据同步（定时任务）
    │   ├── index.js
    │   └── services/
    │       ├── priceSync.js           # 价格同步
    │       └── notificationCheck.js   # 通知检查
    │
    └── common/                        # 云函数公共模块
        ├── db.js                      # 数据库连接
        ├── auth.js                    # 认证中间件
        └── errors.js                  # 错误码定义
```

> **目录设计原则**：前端（`src/`）和后端（`cloudfunctions/`）放在同一个仓库，但逻辑完全分离。云函数每个目录是一个独立的函数，有自己的 `package.json`，部署时按需上传。

---

## 6. 风险评估

### 6.1 技术风险

| 风险 | 等级 | 说明 | 应对策略 |
|------|------|------|---------|
| **CloudBase 停服/涨价** | 低 | 腾讯云核心产品，稳定性高 | 核心代码不使用 CloudBase 私有 API，保持迁移到其他云平台的能力 |
| **NoSQL 复杂查询受限** | 中 | 文档数据库不支持 JOIN、复杂聚合 | 设计时做数据冗余（如收藏表中冗余小区名），用云函数做"应用层 JOIN" |
| **云函数冷启动** | 低 | 长时间不调用后首次响应慢 200-500ms | 首页数据做静态缓存；设置定时触发器"保温"高频函数 |
| **数据源稳定性** | 高 | 房产数据 API 可能涨价、断供、数据不准确 | 1. 支持手动录入补充 2. 数据标注"更新时间"让用户知情 3. 储备2-3个备用数据源 |
| **微信小程序审核** | 中 | 房产类小程序审核较严，可能被拒 | 先做纯网页版上线验证，小程序作为后续扩展 |

### 6.2 业务风险

| 风险 | 等级 | 说明 | 应对策略 |
|------|------|------|---------|
| **数据合规性** | 高 | 抓取房产平台数据存在法律风险 | 优先使用合法授权 API（聚合数据、贝壳开放平台）；不直接爬取竞品 |
| **数据准确性纠纷** | 中 | 用户可能因数据不准产生投诉 | 每页标注"数据更新时间"和"仅供参考"；增加"纠错反馈"入口 |
| **竞品模仿** | 低 | 头部平台（贝壳、安居客）可能跟进 | 聚焦"轻决策"差异化体验，不做全量房源，形成细分心智 |
| **用户留存** | 中 | 买房是低频需求，用户用完即走 | 通过订阅提醒、收藏列表建立"回访钩子"；内容运营（板块分析文章） |

### 6.3 成本风险

| 场景 | 免费额度够用吗？ | 超出的成本预估 |
|------|-----------------|--------------|
| **日均 100 UV** | 完全够用 | ¥0/月 |
| **日均 1000 UV** | 基本够用（数据库读操作可能接近上限） | ¥30-80/月（主要是数据库读次数） |
| **日均 5000 UV** | 需升级 | ¥200-500/月 |
| **数据源 API 费用** | 取决于供应商 | 聚合数据房产类 API 约 ¥300-1000/月（按调用量） |

### 6.4 给独立开发者的实操建议

1. **MVP 阶段先用静态 Mock 数据上线**：原型中的 Mock 数据可以直接用，先验证产品体验，再接入真实数据源。这能让你在**零成本**下快速验证想法。

2. **CloudBase 环境用"按量计费"而非"包年包月"**：初期流量小，按量计费基本不花钱。包年包月反而贵。

3. **云函数一个模块一个函数即可**：不要拆太细。初期 `communities` 一个函数处理所有小区相关逻辑，`users` 一个函数处理用户相关逻辑。拆太细反而不利于理解和调试。

4. **先不做小程序**：小程序的审核、支付、资质要求比网页高很多。先用网页版跑通核心流程，再考虑小程序。

5. **登录先做"可匿名浏览"**：V0.1 阶段不强制登录，用户搜小区、看详情不需要注册。只在收藏、订阅时需要登录。这能大幅降低用户流失率。

6. **数据更新用"定时拉取"而非"实时同步"**：每小时或每6小时拉一次数据即可，房产数据不需要秒级更新。这样可以大幅降低数据源 API 调用成本。

---

## 附录：关键文档链接

- [PRD 文档](./house-assistant-prd.html)
- [原型演示](../Prototype/)
- [启动指南](./Start.md)
- [腾讯云 CloudBase 文档](https://docs.cloudbase.net/)
- [高德地图 Web API 文档](https://lbs.amap.com/api/webservice/summary)
- [聚合数据 - 房产 API](https://www.juhe.cn/docs/index/otherid/1)

---

*本文档由豪斯助手 CTO 团队出具，面向独立开发者。技术选型优先考虑：零运维 > 成本低 > 上手简单 > 性能。*