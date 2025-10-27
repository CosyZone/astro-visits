import { defineConfig } from 'astro/config';
import astroVisits from '@coffic/astro-visits';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    astroVisits({
      // 忽略特定路径，支持精确匹配和通配符
      ignorePaths: ['/admin', '/api/*'],
    }),
  ],

  adapter: cloudflare({
    platformProxy: true,
  }),
});