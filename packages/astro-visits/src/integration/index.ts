import type { AstroIntegration } from 'astro';
import { generateClientScript } from './client-script';

export interface AstroVisitsOptions {
  /**
   * Paths to ignore (won't track visits)
   * Supports exact match and wildcard patterns
   * @example ['/admin', '/api/*', '/private/*']
   * @default []
   */
  ignorePaths?: string[];
}

export default function astroVisitsIntegration(options: AstroVisitsOptions = {}): AstroIntegration {
  const { ignorePaths = [] } = options;

  return {
    name: '@coffic/astro-visits',
    hooks: {
      'astro:config:setup': ({ injectScript, injectRoute, logger }) => {
        // 生成客户端脚本
        const clientScript = generateClientScript(ignorePaths);
        injectScript('page', clientScript);

        // 注入API路由 - 使用相对于example项目node_modules的路径
        // 设置 prerender: false 因为这是一个 API 路由，需要在服务器端动态处理
        injectRoute({
          pattern: '/api/visit',
          entrypoint: '@coffic/astro-visits/visit.ts',
          prerender: false
        });

        if (ignorePaths.length > 0) {
          logger.info(`✅ Integration setup complete (ignoring ${ignorePaths.length} path(s))`);
        } else {
          logger.info(`✅ Integration setup complete`);
        }
      },
    },
  };
}