import astroVisitsIntegration, { type AstroVisitsOptions } from './src/integration/index.ts';

export default astroVisitsIntegration;
export type { AstroVisitsOptions };

// 导出查询工具和类型
export { VisitsQuery } from './src/lib/visits';
export type {
    VisitRecord,
    VisitQueryOptions,
    VisitQueryResult,
    VisitStats,
    DailyStats,
    AggregateOptions,
    AggregateResult,
    DeviceStats,
    OSStats,
    BrowserStats,
    TimezoneStats
} from './src/types/visit';

// 导出 User Agent 工具
export { parseUserAgent, isBot } from './src/lib/user-agent';
export type { ParsedUserAgent } from './src/types/user-agent';