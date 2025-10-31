export interface VisitRecord {
    id: number;
    timestamp: string;
    url: string;
    referrer: string;
    user_agent: string;
    language: string;
    cookies: string;
    screen_width: number;
    screen_height: number;
    color_depth: number;
    timezone: string;
    ip: string;
    created_at: string;
}

export interface VisitQueryOptions {
    /** 页码，从 1 开始 */
    page?: number;
    /** 每页数量，默认 20 */
    limit?: number;
    /** 排序字段 */
    sortBy?: 'timestamp' | 'url' | 'ip' | 'created_at';
    /** 排序方向 */
    sortOrder?: 'asc' | 'desc';
    /** 筛选条件 */
    filters?: {
        /** URL 包含关键词 */
        url?: string;
        /** IP 地址 */
        ip?: string;
        /** 时间范围开始 */
        startDate?: string;
        /** 时间范围结束 */
        endDate?: string;
        /** 语言 */
        language?: string;
        /** 时区 */
        timezone?: string;
    };
}

export interface VisitQueryResult {
    /** 访问记录列表 */
    data: VisitRecord[];
    /** 分页信息 */
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface VisitStats {
    /** 总访问量 */
    totalVisits: number;
    /** 独立访客数（按 IP） */
    uniqueVisitors: number;
    /** 今日访问量 */
    todayVisits: number;
    /** 最常访问的页面 */
    topPages: Array<{ url: string; count: number }>;
    /** 访问来源统计 */
    referrers: Array<{ referrer: string; count: number }>;
    /** 设备统计 */
    devices: Array<{ user_agent: string; count: number }>;
}

/** 每日统计信息 */
export interface DailyStats {
    /** 日期 */
    date: string;
    /** 访问量 */
    count: number;
    /** 独立访客数（按 IP 去重） */
    uniqueVisitors?: number;
    /** 机器人访问数 */
    botCount?: number;
    /** 人类访问数 */
    humanCount?: number;
}

/** 聚合查询选项 */
export interface AggregateOptions {
    /** 分组字段 */
    groupBy: 'url' | 'device' | 'os' | 'browser' | 'timezone' | 'date';
    /** 开始日期 */
    startDate?: string;
    /** 结束日期 */
    endDate?: string;
    /** 最近 N 天 */
    days?: number;
    /** 返回数量限制 */
    limit?: number;
    /** 排序字段 */
    orderBy?: 'count' | 'date';
    /** 排序方向 */
    orderDirection?: 'asc' | 'desc';
}

/** 聚合查询结果 */
export interface AggregateResult {
    /** 分组键 */
    key: string;
    /** 计数 */
    count: number;
}

/** 设备统计 */
export interface DeviceStats {
    /** 设备类型 */
    device: string;
    /** 访问次数 */
    count: number;
}

/** 操作系统统计 */
export interface OSStats {
    /** 操作系统名称 */
    os: string;
    /** 访问次数 */
    count: number;
}

/** 浏览器统计 */
export interface BrowserStats {
    /** 浏览器名称 */
    browser: string;
    /** 访问次数 */
    count: number;
}

/** 时区统计 */
export interface TimezoneStats {
    /** 时区名称 */
    timezone: string;
    /** 访问次数 */
    count: number;
}
