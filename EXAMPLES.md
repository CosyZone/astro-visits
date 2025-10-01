# astro-visits 使用示例

## 基本使用

### 1. 在 Astro 页面中查询数据

```typescript
// pages/admin.astro
---
import { VisitsQuery } from 'astro-visits';

// 创建查询实例（直接传递 Astro.locals）
const visitsQuery = new VisitsQuery(Astro.locals);

// 获取访问记录（分页）
const visits = await visitsQuery.getVisits({
  page: 1,
  limit: 20,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});

// 获取统计数据
const stats = await visitsQuery.getStats();
---

<div>
  <h1>访问统计</h1>
  <p>总访问量：{stats.totalVisits}</p>
  <p>独立访客：{stats.uniqueVisitors}</p>
  <p>今日访问：{stats.todayVisits}</p>
</div>

<div>
  <h2>访问记录</h2>
  {visits.data.map(visit => (
    <div key={visit.id}>
      <p>时间：{visit.timestamp}</p>
      <p>URL：{visit.url}</p>
      <p>IP：{visit.ip}</p>
    </div>
  ))}
</div>
```

### 2. 创建 API 路由（带身份验证）

```typescript
// pages/api/admin/visits.ts
---
import type { APIRoute } from 'astro';
import { VisitsQuery } from 'astro-visits';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  // 身份验证（示例：检查 session）
  const session = locals.session;
  if (!session?.user?.isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const urlFilter = url.searchParams.get('url') || undefined;

    const db = locals.runtime?.env?.VISITS_DB;
    const visitsQuery = new VisitsQuery(db);

    const result = await visitsQuery.getVisits({
      page,
      limit,
      filters: {
        url: urlFilter
      }
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
---
```

### 3. 使用 Astro 中间件进行身份验证

```typescript
// middleware.ts
import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, locals } = context;

  // 只对管理页面进行身份验证
  if (url.pathname.startsWith('/admin')) {
    // 检查 session 或 token
    const session = locals.session;
    if (!session?.user?.isAdmin) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  return next();
};
```

### 4. 在 React 组件中使用

```tsx
// components/VisitDashboard.tsx
import { useState, useEffect } from 'react';
import {
  VisitsQuery,
  type VisitQueryOptions,
  type VisitStats,
} from 'astro-visits';

interface Props {
  db: any; // D1 数据库实例
}

export function VisitDashboard({ db }: Props) {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const visitsQuery = new VisitsQuery(db);

        const [visitsData, statsData] = await Promise.all([
          visitsQuery.getVisits({ page, limit: 20 }),
          visitsQuery.getStats(),
        ]);

        setVisits(visitsData.data);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [page]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>访问统计</h1>
      <p>总访问量：{stats?.totalVisits}</p>
      <p>独立访客：{stats?.uniqueVisitors}</p>

      <h2>访问记录</h2>
      {visits.map((visit: any) => (
        <div key={visit.id}>
          <p>
            {visit.timestamp} - {visit.url}
          </p>
        </div>
      ))}

      <button onClick={() => setPage(page + 1)}>下一页</button>
    </div>
  );
}
```

## 高级查询示例

### 1. 时间范围查询

```typescript
// 获取最近 7 天的访问记录
const recentVisits = await visitsQuery.getVisitsByDateRange(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  new Date().toISOString(),
  { limit: 100 }
);

// 获取今日访问统计
const todayStats = await visitsQuery.getRecentStats(1);
```

### 2. 特定页面分析

```typescript
// 分析特定页面的访问情况
const aboutPageVisits = await visitsQuery.getVisitsByUrl('/about', {
  sortBy: 'timestamp',
  sortOrder: 'desc',
});

// 获取热门页面
const topPages = await visitsQuery.getTopPages(20);
```

### 3. 用户行为分析

```typescript
// 分析特定 IP 的访问行为
const userVisits = await visitsQuery.getVisitsByIp('192.168.1.1', {
  sortBy: 'timestamp',
  sortOrder: 'desc',
});

// 获取访问来源统计
const referrerStats = await visitsQuery.getReferrerStats(15);
```

### 4. 数据清理

```typescript
// 删除特定记录
const deleted = await visitsQuery.deleteVisit(123);

// 批量删除旧记录（例如删除 30 天前的记录）
const oldVisits = await visitsQuery.getVisitsByDateRange(
  '2023-01-01',
  '2023-01-31'
);
const oldIds = oldVisits.data.map((v) => v.id);
const deletedCount = await visitsQuery.deleteVisits(oldIds);
```

## 与不同框架集成

### 1. Next.js API 路由

```typescript
// pages/api/visits.ts
import { VisitsQuery } from 'astro-visits';

export default async function handler(req, res) {
  // 身份验证
  if (!req.session?.user?.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getD1Database(); // 你的 D1 数据库获取方法
  const visitsQuery = new VisitsQuery(db);

  const visits = await visitsQuery.getVisits({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });

  res.json(visits);
}
```

### 2. SvelteKit 页面

```typescript
// src/routes/admin/+page.server.ts
import { VisitsQuery } from 'astro-visits';

export async function load({ locals, url }) {
  // 身份验证
  if (!locals.user?.isAdmin) {
    throw error(401, 'Unauthorized');
  }

  const db = locals.runtime?.env?.VISITS_DB;
  const visitsQuery = new VisitsQuery(db);

  const page = parseInt(url.searchParams.get('page') || '1');
  const visits = await visitsQuery.getVisits({ page, limit: 20 });
  const stats = await visitsQuery.getStats();

  return {
    visits,
    stats,
  };
}
```

## 注意事项

1. **数据库权限**：确保你的应用有权限访问 D1 数据库
2. **错误处理**：始终包装数据库操作在 try-catch 中
3. **性能优化**：大量数据时使用分页，避免一次性加载过多记录
4. **安全性**：在生产环境中实施适当的身份验证和授权
5. **类型安全**：使用 TypeScript 类型定义确保类型安全

现在你可以完全控制数据访问、身份验证和用户界面了！🎉
