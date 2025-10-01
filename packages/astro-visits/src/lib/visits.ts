import type { VisitQueryOptions, VisitQueryResult, VisitRecord, VisitStats } from '../types/visit';

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
            return result.changes > 0;
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
            return result.changes;
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
      WHERE timestamp >= datetime('now', '-${days} days')
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `).all();

        return result.results || [];
    }

    /**
     * 获取热门页面（按访问量排序）
     */
    async getTopPages(limit: number = 10): Promise<Array<{ url: string; count: number }>> {
        const result = await this.db.prepare(`
      SELECT url, COUNT(*) as count 
      FROM visits 
      GROUP BY url 
      ORDER BY count DESC 
      LIMIT ?
    `).bind(limit).all();

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
}
