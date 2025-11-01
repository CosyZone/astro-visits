import type {
    VisitQueryOptions,
    VisitQueryResult,
    VisitRecord,
    VisitStats,
    DailyStats,
    AggregateOptions,
    AggregateResult,
    DeviceStats,
    OSStats,
    BrowserStats,
    TimezoneStats
} from '../types/visit';
import { parseUserAgent, isBot } from './user-agent';

/**
 * 访问数据查询工具类
 * 接收 Astro.locals，内部自动获取正确的数据库绑定
 */
export class VisitsQuery {
    private db: any;

    constructor(locals: any) {
        // 从环境变量获取绑定名称（由集成设置）
        const bindingName = process.env.ASTRO_VISITS_BINDING || 'VISITS_DB';
        this.db = locals?.runtime?.env?.[bindingName];

        if (!this.db) {
            throw new Error(`Database binding '${bindingName}' not available. Make sure you have configured the astro-visits integration with the correct binding name.`);
        }
    }

    /**
     * 查询访问记录
     */
    async getVisits(options: VisitQueryOptions = {}): Promise<VisitQueryResult> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'timestamp',
            sortOrder = 'desc',
            filters = {}
        } = options;

        // 构建 WHERE 条件
        const whereConditions: string[] = [];
        const bindValues: any[] = [];

        if (filters.url) {
            whereConditions.push('url LIKE ?');
            bindValues.push(`%${filters.url}%`);
        }

        if (filters.ip) {
            whereConditions.push('ip = ?');
            bindValues.push(filters.ip);
        }

        if (filters.startDate) {
            whereConditions.push('timestamp >= ?');
            bindValues.push(filters.startDate);
        }

        if (filters.endDate) {
            whereConditions.push('timestamp <= ?');
            bindValues.push(filters.endDate);
        }

        if (filters.language) {
            whereConditions.push('language = ?');
            bindValues.push(filters.language);
        }

        if (filters.timezone) {
            whereConditions.push('timezone = ?');
            bindValues.push(filters.timezone);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // 获取总数
        const countQuery = `SELECT COUNT(*) as total FROM visits ${whereClause}`;
        const countResult = await this.db.prepare(countQuery).bind(...bindValues).first();
        const total = countResult?.total || 0;

        // 计算分页
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // 查询数据
        const dataQuery = `
      SELECT * FROM visits 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

        const dataResult = await this.db.prepare(dataQuery)
            .bind(...bindValues, limit, offset)
            .all();

        return {
            data: dataResult.results || [],
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    /**
     * 获取访问统计
     */
    async getStats(): Promise<VisitStats> {
        // 总访问量
        const totalVisitsResult = await this.db.prepare('SELECT COUNT(*) as total FROM visits').first();
        const totalVisits = totalVisitsResult?.total || 0;

        // 独立访客数
        const uniqueVisitorsResult = await this.db.prepare('SELECT COUNT(DISTINCT ip) as unique_count FROM visits').first();
        const uniqueVisitors = uniqueVisitorsResult?.unique_count || 0;

        // 今日访问量
        const today = new Date().toISOString().split('T')[0];
        const todayVisitsResult = await this.db.prepare(
            'SELECT COUNT(*) as today FROM visits WHERE DATE(timestamp) = ?'
        ).bind(today).first();
        const todayVisits = todayVisitsResult?.today || 0;

        // 最常访问的页面
        const topPagesResult = await this.db.prepare(`
      SELECT url, COUNT(*) as count 
      FROM visits 
      GROUP BY url 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
        const topPages = topPagesResult.results || [];

        // 访问来源统计
        const referrersResult = await this.db.prepare(`
      SELECT referrer, COUNT(*) as count 
      FROM visits 
      WHERE referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
        const referrers = referrersResult.results || [];

        // 设备统计（简化版，按 user_agent 前 50 字符分组）
        const devicesResult = await this.db.prepare(`
      SELECT SUBSTR(user_agent, 1, 50) as user_agent, COUNT(*) as count 
      FROM visits 
      GROUP BY SUBSTR(user_agent, 1, 50)
      ORDER BY count DESC 
      LIMIT 10
    `).all();
        const devices = devicesResult.results || [];

        return {
            totalVisits,
            uniqueVisitors,
            todayVisits,
            topPages,
            referrers,
            devices
        };
    }

    /**
     * 删除访问记录
     */
    async deleteVisit(id: number): Promise<boolean> {
        try {
            const result = await this.db.prepare('DELETE FROM visits WHERE id = ?').bind(id).run();
            return result.meta.changes > 0;
        } catch (error) {
            console.error('Delete visit error:', error);
            return false;
        }
    }

    /**
     * 批量删除访问记录
     */
    async deleteVisits(ids: number[]): Promise<number> {
        if (ids.length === 0) return 0;

        try {
            const placeholders = ids.map(() => '?').join(',');
            const result = await this.db.prepare(`DELETE FROM visits WHERE id IN (${placeholders})`)
                .bind(...ids).run();
            return result.meta.changes;
        } catch (error) {
            console.error('Batch delete visits error:', error);
            return 0;
        }
    }

    /**
     * 获取指定时间范围内的访问记录
     */
    async getVisitsByDateRange(startDate: string, endDate: string, options: Omit<VisitQueryOptions, 'filters'> = {}): Promise<VisitQueryResult> {
        return this.getVisits({
            ...options,
            filters: {
                startDate,
                endDate
            }
        });
    }

    /**
     * 获取指定 URL 的访问记录
     */
    async getVisitsByUrl(url: string, options: Omit<VisitQueryOptions, 'filters'> = {}): Promise<VisitQueryResult> {
        return this.getVisits({
            ...options,
            filters: {
                url
            }
        });
    }

    /**
     * 获取指定 IP 的访问记录
     */
    async getVisitsByIp(ip: string, options: Omit<VisitQueryOptions, 'filters'> = {}): Promise<VisitQueryResult> {
        return this.getVisits({
            ...options,
            filters: {
                ip
            }
        });
    }

    /**
     * 获取最近 N 天的访问统计
     */
    async getRecentStats(days: number = 7): Promise<Array<{ date: string; count: number }>> {
        const result = await this.db.prepare(`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM visits 
      WHERE timestamp >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `).bind(days).all();

        return result.results || [];
    }

    /**
     * 获取访问趋势统计（增强版）
     * @param days - 最近 N 天
     * @param options - 选项：包含独立访客数、机器人统计
     */
    async getTrendStats(
        days: number = 7,
        options: {
            includeUniqueVisitors?: boolean;
            includeBotStats?: boolean;
        } = {}
    ): Promise<DailyStats[]> {
        const { includeUniqueVisitors = false, includeBotStats = false } = options;

        // 构建基础查询
        let query = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
    `;

        // 如果需要独立访客数
        if (includeUniqueVisitors) {
            query += `, COUNT(DISTINCT ip) as uniqueVisitors`;
        }

        // 如果需要机器人统计（需要在应用层解析）
        // 使用自定义分隔符 ||| 避免 user_agent 中包含逗号导致分割错误
        if (includeBotStats) {
            query += `, GROUP_CONCAT(user_agent, '|||') as user_agents`;
        }

        query += `
      FROM visits 
      WHERE timestamp >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

        const result = await this.db.prepare(query).bind(days).all();
        const rawData = result.results || [];

        // 处理机器人统计（应用层处理）
        if (includeBotStats) {
            return rawData.map((row: any) => {
                // 使用自定义分隔符 ||| 分割 user_agent
                const userAgents = row.user_agents ? row.user_agents.split('|||').filter((ua: string) => ua.trim() !== '') : [];
                let botCount = 0;
                let humanCount = 0;

                userAgents.forEach((ua: string) => {
                    if (isBot(ua)) {
                        botCount++;
                    } else {
                        humanCount++;
                    }
                });

                // 确保 botCount + humanCount <= count（理论上应该相等）
                // 如果出现不一致，使用 count 作为基准进行修正
                const totalDetected = botCount + humanCount;
                if (totalDetected !== row.count) {
                    // 如果检测到的总数与数据库记录数不一致，按比例调整
                    if (totalDetected > 0) {
                        const ratio = row.count / totalDetected;
                        botCount = Math.round(botCount * ratio);
                        humanCount = row.count - botCount; // 确保总数等于 count
                    } else {
                        // 如果无法检测（所有 user_agent 都为空），默认全部为 human
                        humanCount = row.count;
                        botCount = 0;
                    }
                }

                const stats: DailyStats = {
                    date: row.date,
                    count: row.count,
                    botCount,
                    humanCount
                };

                if (includeUniqueVisitors) {
                    stats.uniqueVisitors = row.uniqueVisitors;
                }

                return stats;
            });
        }

        // 不需要机器人统计的情况
        return rawData.map((row: any) => {
            const stats: DailyStats = {
                date: row.date,
                count: row.count
            };

            if (includeUniqueVisitors) {
                stats.uniqueVisitors = row.uniqueVisitors;
            }

            return stats;
        });
    }

    /**
     * 获取热门页面（按访问量排序）
     * @param limit - 返回数量限制
     * @param options - 时间范围选项
     */
    async getTopPages(
        limit: number = 10,
        options: {
            days?: number;
            startDate?: string;
            endDate?: string;
        } = {}
    ): Promise<Array<{ url: string; count: number }>> {
        const { days, startDate, endDate } = options;

        const whereConditions: string[] = [];
        const bindValues: any[] = [];

        if (days) {
            whereConditions.push(`timestamp >= datetime('now', '-' || ? || ' days')`);
            bindValues.push(days);
        }

        if (startDate) {
            whereConditions.push('timestamp >= ?');
            bindValues.push(startDate);
        }

        if (endDate) {
            whereConditions.push('timestamp <= ?');
            bindValues.push(endDate);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const query = `
      SELECT url, COUNT(*) as count 
      FROM visits 
      ${whereClause}
      GROUP BY url 
      ORDER BY count DESC 
      LIMIT ?
    `;

        const result = await this.db.prepare(query).bind(...bindValues, limit).all();
        return result.results || [];
    }

    /**
     * 获取访问来源统计
     */
    async getReferrerStats(limit: number = 10): Promise<Array<{ referrer: string; count: number }>> {
        const result = await this.db.prepare(`
      SELECT referrer, COUNT(*) as count 
      FROM visits 
      WHERE referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT ?
    `).bind(limit).all();

        return result.results || [];
    }

    /**
     * 通用聚合查询
     * @param options - 聚合查询选项
     */
    async aggregate(options: AggregateOptions): Promise<AggregateResult[]> {
        const {
            groupBy,
            startDate,
            endDate,
            days,
            limit = 100,
            orderBy = 'count',
            orderDirection = 'desc'
        } = options;

        // 构建 WHERE 条件
        const whereConditions: string[] = [];
        const bindValues: any[] = [];

        if (days) {
            whereConditions.push(`timestamp >= datetime('now', '-' || ? || ' days')`);
            bindValues.push(days);
        }

        if (startDate) {
            whereConditions.push('timestamp >= ?');
            bindValues.push(startDate);
        }

        if (endDate) {
            whereConditions.push('timestamp <= ?');
            bindValues.push(endDate);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // 根据 groupBy 确定分组字段
        let groupField: string;
        let needsPostProcessing = false;

        switch (groupBy) {
            case 'url':
                groupField = 'url';
                break;
            case 'timezone':
                groupField = 'timezone';
                break;
            case 'date':
                groupField = 'DATE(timestamp)';
                break;
            case 'device':
            case 'os':
            case 'browser':
                // 这些需要在应用层解析 user_agent
                groupField = 'user_agent';
                needsPostProcessing = true;
                break;
            default:
                throw new Error(`Unsupported groupBy: ${groupBy}`);
        }

        // 执行查询
        let query = `
      SELECT ${groupField} as group_key, COUNT(*) as count
    `;

        if (needsPostProcessing) {
            query += `, GROUP_CONCAT(user_agent) as user_agents`;
        }

        query += `
      FROM visits 
      ${whereClause}
      GROUP BY ${groupField}
    `;

        // 排序
        if (orderBy === 'date' && groupBy === 'date') {
            query += ` ORDER BY ${groupField} ${orderDirection.toUpperCase()}`;
        } else if (orderBy === 'count') {
            query += ` ORDER BY count ${orderDirection.toUpperCase()}`;
        }

        query += ` LIMIT ?`;

        const result = await this.db.prepare(query).bind(...bindValues, limit).all();
        const rawData = result.results || [];

        // 如果需要后处理（设备/OS/浏览器解析）
        if (needsPostProcessing) {
            const aggregated = new Map<string, number>();

            rawData.forEach((row: any) => {
                const userAgents = row.user_agents ? row.user_agents.split(',') : [];

                userAgents.forEach((ua: string) => {
                    const parsed = parseUserAgent(ua);
                    let key: string;

                    switch (groupBy) {
                        case 'device':
                            key = parsed.device;
                            break;
                        case 'os':
                            key = parsed.os;
                            break;
                        case 'browser':
                            key = parsed.browser;
                            break;
                        default:
                            key = 'unknown';
                    }

                    aggregated.set(key, (aggregated.get(key) || 0) + 1);
                });
            });

            // 转换为数组并排序
            const results = Array.from(aggregated.entries())
                .map(([key, count]) => ({ key, count }))
                .sort((a, b) => {
                    if (orderBy === 'count') {
                        return orderDirection === 'desc' ? b.count - a.count : a.count - b.count;
                    }
                    return 0;
                })
                .slice(0, limit);

            return results;
        }

        // 不需要后处理的情况
        return rawData.map((row: any) => ({
            key: String(row.group_key || ''),
            count: row.count
        }));
    }

    /**
     * 获取设备统计
     * @param options - 时间范围选项
     */
    async getDeviceStats(options: {
        days?: number;
        startDate?: string;
        endDate?: string;
    } = {}): Promise<DeviceStats[]> {
        const results = await this.aggregate({
            groupBy: 'device',
            ...options
        });

        return results.map(r => ({
            device: r.key,
            count: r.count
        }));
    }

    /**
     * 获取操作系统统计
     * @param options - 时间范围选项
     */
    async getOSStats(options: {
        days?: number;
        startDate?: string;
        endDate?: string;
    } = {}): Promise<OSStats[]> {
        const results = await this.aggregate({
            groupBy: 'os',
            ...options
        });

        return results.map(r => ({
            os: r.key,
            count: r.count
        }));
    }

    /**
     * 获取浏览器统计
     * @param options - 时间范围选项
     */
    async getBrowserStats(options: {
        days?: number;
        startDate?: string;
        endDate?: string;
    } = {}): Promise<BrowserStats[]> {
        const results = await this.aggregate({
            groupBy: 'browser',
            ...options
        });

        return results.map(r => ({
            browser: r.key,
            count: r.count
        }));
    }

    /**
     * 获取时区统计
     * @param options - 时间范围选项
     */
    async getTimezoneStats(options: {
        days?: number;
        startDate?: string;
        endDate?: string;
        limit?: number;
    } = {}): Promise<TimezoneStats[]> {
        const results = await this.aggregate({
            groupBy: 'timezone',
            limit: options.limit || 50,
            ...options
        });

        return results.map(r => ({
            timezone: r.key,
            count: r.count
        }));
    }
}
