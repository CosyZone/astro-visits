import { defineConfig } from 'astro/config';
import astroVisits from './index.ts';

export default defineConfig({
    integrations: [astroVisits({
        binding: 'VISITS_DB',
        trackDev: true // 在开发模式下也启用跟踪以便测试
    })],
});