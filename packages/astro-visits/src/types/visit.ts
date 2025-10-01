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
