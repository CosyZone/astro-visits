import type { APIRoute } from 'astro';
import schemaSql from '../../integration/schema.sql?raw';

export interface VisitData {
    timestamp: string;
    url: string;
    referrer: string;
    userAgent: string;
    language: string;
    cookies: string;
    screenWidth: number;
    screenHeight: number;
    colorDepth: number;
    timezone: string;
}

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // 解析请求体
        const data: VisitData = await request.json();

        // 获取访客IP地址（从请求头中）
        const clientIP = request.headers.get('cf-connecting-ip') ||
            request.headers.get('x-forwarded-for') ||
            'unknown';

        // 添加IP地址到数据中
        const visitData = {
            ...data,
            ip: clientIP,
        };

        // 获取D1数据库绑定（开发环境由中间件模拟，生产环境为真实绑定）
        const db = (locals as any).runtime?.env?.VISITS_DB;

        if (!db) {
            console.error('Database binding \'VISITS_DB\' not available');
            return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // 在插入前确保数据库已迁移（幂等：IF NOT EXISTS）
        try {
            // 去除注释与空行，按分号切分后逐条执行，规避首行注释导致的 D1_EXEC_ERROR
            const sanitized = schemaSql
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0 && !line.startsWith('--'))
                .join('\n');
            const statements = sanitized
                .split(';')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            for (const stmt of statements) {
                await db.prepare(stmt).run();
            }
        } catch (migrateError) {
            console.error('Schema migration error:', migrateError);
            return new Response(JSON.stringify({ success: false, error: 'Schema migration failed' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // 将数据插入D1数据库
        try {
            await db.prepare(`
        INSERT INTO visits (
          timestamp, url, referrer, user_agent, language, 
          cookies, screen_width, screen_height, color_depth, 
          timezone, ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
                visitData.timestamp,
                visitData.url,
                visitData.referrer,
                visitData.userAgent,
                visitData.language,
                visitData.cookies,
                visitData.screenWidth,
                visitData.screenHeight,
                visitData.colorDepth,
                visitData.timezone,
                visitData.ip
            ).run();

            console.log('Visit recorded:', {
                url: visitData.url,
                ip: visitData.ip,
                timestamp: visitData.timestamp
            });

            return new Response(JSON.stringify({ success: true, message: 'Visit recorded' }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (dbError) {
            console.error('Database error:', {
                url: visitData?.url || 'unknown',
                ip: visitData?.ip || 'unknown',
                error: dbError instanceof Error ? dbError.message : 'Unknown database error'
            });
            return new Response(JSON.stringify({ success: false, error: 'Database error' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('[astro-visits] Error processing visit:', error);
        return new Response(JSON.stringify({ success: false, error: 'Invalid request data' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};