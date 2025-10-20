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
- 支持开发模式

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

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `binding` | `string` | `'VISITS_DB'` | Cloudflare D1 数据库绑定名称 |
| `trackDev` | `boolean` | `false` | 是否在开发模式下跟踪访问 |

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
