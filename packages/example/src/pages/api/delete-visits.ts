import type { APIRoute } from 'astro';
import { VisitsQuery } from '@coffic/astro-visits';

export const prerender = false;

export const DELETE: APIRoute = async ({ request, locals }) => {
    try {
        const data = await request.json();
        const { id, ids } = data;

        const visitsQuery = new VisitsQuery(locals);

        // 单个删除
        if (id !== undefined) {
            const success = await visitsQuery.deleteVisit(Number(id));
            if (success) {
                return new Response(JSON.stringify({ success: true, message: '删除成功' }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                return new Response(JSON.stringify({ success: false, message: '删除失败，记录不存在或已被删除' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        }

        // 批量删除
        if (ids && Array.isArray(ids) && ids.length > 0) {
            const numericIds = ids.map(id => Number(id));
            const deletedCount = await visitsQuery.deleteVisits(numericIds);
            if (deletedCount > 0) {
                return new Response(JSON.stringify({ success: true, deletedCount, message: `成功删除 ${deletedCount} 条记录` }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                return new Response(JSON.stringify({ success: false, message: '删除失败，未找到匹配的记录' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        }

        return new Response(JSON.stringify({ success: false, message: '无效的请求参数' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Delete visits API error:', error);
        return new Response(JSON.stringify({ success: false, message: '服务器错误' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};

