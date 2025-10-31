# Astro 访问统计集成

一个用于跟踪访问者信息并将其存储在 Cloudflare D1 数据库中的 Astro 集成。

## 功能特性

- 跟踪访问者信息，包括：
  - 时间戳
  - URL
  - 来源页面
  - 用户代理
  - 语言设置
  - Cookie 信息
  - 屏幕尺寸
  - 颜色深度
  - 时区信息
  - IP 地址
- 自动在每个页面中注入客户端跟踪脚本
- 自动注入服务器端 API 路由用于数据收集
- 将数据存储在 Cloudflare D1 数据库中
- 支持 Cloudflare Workers
- 增强的统计 API - 支持独立访客数和机器人检测
- 时间范围支持 - 聚合查询支持时间过滤
- User Agent 解析工具 - 设备、操作系统、浏览器识别
- 多维度统计 - 设备、OS、浏览器、时区统计

## 安装

使用 Astro 提供的便捷命令来安装和配置此集成：

```bash
astro add astro-visits
```

## 使用方法

使用 `astro add` 命令安装后，集成将自动添加到您的 Astro 配置中。

该集成将自动：

1. 在每个页面中注入客户端脚本以收集访问者信息
2. 注入服务器端 API 路由 `/api/visit` 用于接收和存储数据

## Cloudflare 设置

1. 创建 D1 数据库：

   ```bash
   wrangler d1 create visits-db
   ```

2. 更新您的 `wrangler.toml`：

   ```toml
   [[ d1_databases ]]
   binding = "VISITS_DB"
   database_name = "visits-db"
   database_id = "your-database-id"
   ```

## 工作原理

该集成会自动在每个页面中注入跟踪 JavaScript，收集访问者信息并发送到 `/api/visit` 端点。端点随后将这些信息存储在您的 Cloudflare D1 数据库中。

## 查询 API

数据收集完成后，您可以使用 `VisitsQuery` 类来查询和分析访问数据。

### 基础用法

```typescript
import { VisitsQuery } from '@coffic/astro-visits';

// 在 Astro API 路由或页面中
const visitsQuery = new VisitsQuery(Astro.locals);

// 获取基础统计
const stats = await visitsQuery.getStats();

// 获取最近的访问记录
const visits = await visitsQuery.getVisits({ limit: 50 });
```

### 增强的趋势统计

```typescript
// 获取包含独立访客数和机器人统计的趋势数据
const trends = await visitsQuery.getTrendStats(7, {
  includeUniqueVisitors: true,
  includeBotStats: true
});
// 返回: [{ date: '2025-10-31', count: 100, uniqueVisitors: 50, botCount: 10, humanCount: 90 }, ...]
```

### 支持时间范围的热门页面

```typescript
// 获取最近 7 天的热门页面
const topPages = await visitsQuery.getTopPages(20, { days: 7 });

// 获取指定时间范围的热门页面
const topPagesMonth = await visitsQuery.getTopPages(20, {
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});
```

### 多维度统计

```typescript
// 设备统计
const deviceStats = await visitsQuery.getDeviceStats({ days: 30 });

// 操作系统统计
const osStats = await visitsQuery.getOSStats({ days: 30 });

// 浏览器统计
const browserStats = await visitsQuery.getBrowserStats({ days: 30 });

// 时区统计
const timezoneStats = await visitsQuery.getTimezoneStats({ days: 30, limit: 20 });
```

### 通用聚合查询

```typescript
// 灵活的按任意维度聚合
const results = await visitsQuery.aggregate({
  groupBy: 'device',  // 或 'os', 'browser', 'url', 'timezone', 'date'
  days: 30,
  limit: 10,
  orderBy: 'count',
  orderDirection: 'desc'
});
```

### User Agent 工具函数

```typescript
import { parseUserAgent, isBot } from '@coffic/astro-visits';

// 解析 User Agent
const parsed = parseUserAgent(userAgentString);
// 返回: { device: 'desktop', os: 'macOS', browser: 'Chrome', isBot: false }

// 快速检测是否为机器人
const isBotUser = isBot(userAgentString);
// 返回: true/false
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `binding` | `string` | `'VISITS_DB'` | Cloudflare D1 数据库绑定名称 |
| `ignorePaths` | `string[]` | `[]` | 要忽略的路径（不会跟踪访问）。支持精确匹配和通配符模式 |

### 配置示例

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import astroVisits from '@coffic/astro-visits';

export default defineConfig({
  integrations: [
    astroVisits({
      // 忽略特定路径 - 支持精确匹配和通配符模式
      ignorePaths: [
        '/admin',           // 精确匹配：忽略 /admin
        '/api/*',          // 通配符：忽略所有以 /api/ 开头的路径
        '/private/*',      // 通配符：忽略所有以 /private/ 开头的路径
      ],
    }),
  ],
});
```

## 开发

本项目使用 pnpm workspaces 的 monorepo 结构：

```text
astro-visits/
├── package.json              # 根目录的包管理配置
├── pnpm-workspace.yaml       # pnpm workspace 配置
├── packages/
│   ├── astro-visits/         # Astro 集成包
│   │   ├── index.ts          # 集成入口文件
│   │   ├── package.json      # 集成包配置
│   │   ├── integration/      # 集成源代码
│   │   │   ├── index.ts      # 主集成实现
│   │   │   └── schema.sql    # 数据库结构
│   │   └── src/
│   │       └── pages/
│   │           └── api/
│   │               └── visit.ts  # 访问跟踪 API 端点
│   └── example/              # 使用集成的示例项目
│       ├── package.json      # 示例项目配置
│       ├── astro.config.mjs  # 示例项目 Astro 配置
│       └── src/
│           └── pages/
│               ├── index.astro  # 示例首页
│               └── about.astro  # 示例关于页面
```

### 安装依赖

```bash
pnpm install
```

### 运行示例项目

```bash
# 从根目录运行
pnpm dev

# 或者从示例项目目录运行
cd packages/example
pnpm dev
```

这将启动示例 Astro 项目，运行在可用端口上

## API 参考

### VisitsQuery 类

用于查询访问数据的主类。使用 `new VisitsQuery(locals)` 实例化。

#### 方法

- `getVisits(options?)` - 获取分页的访问记录
- `getStats()` - 获取总体统计
- `getRecentStats(days)` - 获取最近几天的每日统计
- `getTrendStats(days, options?)` - 获取增强的趋势统计（包含独立访客数和机器人统计）
- `getTopPages(limit, options?)` - 获取热门页面（支持时间范围）
- `getDeviceStats(options?)` - 获取设备类型统计
- `getOSStats(options?)` - 获取操作系统统计
- `getBrowserStats(options?)` - 获取浏览器统计
- `getTimezoneStats(options?)` - 获取时区统计
- `aggregate(options)` - 通用聚合查询

### 工具函数

- `parseUserAgent(userAgent: string)` - 解析 User Agent 字符串
- `isBot(userAgent: string)` - 检测是否为机器人

详细的 API 文档，请参阅[使用示例](./USAGE_EXAMPLES.md)文件。

### 构建集成

```bash
# 从根目录构建
pnpm build

# 或者从集成包目录构建
cd packages/astro-visits
pnpm build
```

## 许可证

MIT
