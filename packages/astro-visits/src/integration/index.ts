import type { AstroIntegration } from 'astro';
import { CLIENT_SCRIPT_TEMPLATE } from '../lib/client-script';

export interface AstroVisitsOptions {
  /**
   * Whether to track in development mode
   * @default false
   */
  trackDev?: boolean;
}

export default function astroVisitsIntegration(options: AstroVisitsOptions = {}): AstroIntegration {
  const { trackDev = false } = options;

  return {
    name: '@coffic/astro-visits',
    hooks: {
      'astro:config:setup': ({ injectScript, injectRoute, logger }) => {
        // 使用模板生成客户端脚本
        const disableInDev = !trackDev;
        const clientScript = CLIENT_SCRIPT_TEMPLATE.replace('%%DISABLE_IN_DEV%%', JSON.stringify(disableInDev));

        injectScript('page', `import "@coffic/astro-visits/client.js";`);

        // 注入API路由 - 使用相对于example项目node_modules的路径
        // 设置 prerender: false 因为这是一个 API 路由，需要在服务器端动态处理
        injectRoute({
          pattern: '/api/visit',
          entrypoint: '@coffic/astro-visits/visit.ts',
          prerender: false
        });

        logger.info(`✅ Integration setup complete`);
      },
    },
  };
}