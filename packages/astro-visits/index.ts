import astroVisitsIntegration, { type AstroVisitsOptions } from './src/integration/index.ts';

export default astroVisitsIntegration;
export type { AstroVisitsOptions };

// 导出查询工具和类型
export { VisitsQuery } from './src/lib/visits';
export type {
    VisitRecord,
    VisitQueryOptions,
    VisitQueryResult,
    VisitStats
} from './src/types/visit';