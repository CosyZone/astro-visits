import type { AstroIntegration } from 'astro';
import { CLIENT_SCRIPT_TEMPLATE } from '../lib/client-script';

export interface AstroVisitsOptions {
  /**
   * The Cloudflare D1 database binding name
   * @default 'VISITS_DB'
   */
  binding?: string;

  /**
   * Whether to track in development mode
   * @default false
   */
  trackDev?: boolean;
}

export default function astroVisitsIntegration(options: AstroVisitsOptions = {}): AstroIntegration {
  const { binding = 'VISITS_DB', trackDev = false } = options;

  return {
    name: '@coffic/astro-visits',
    hooks: {
      'astro:config:setup': ({ injectScript, injectRoute, logger }) => {
        // 设置环境变量，让 API 路由知道使用哪个绑定名称
        process.env.ASTRO_VISITS_BINDING = binding;

        // 使用模板生成客户端脚本
        const disableInDev = !trackDev;
        const clientScript = CLIENT_SCRIPT_TEMPLATE.replace('%%DISABLE_IN_DEV%%', JSON.stringify(disableInDev));

        injectScript('page', clientScript);

        // 注入API路由 - 使用相对于example项目node_modules的路径
        // 设置 prerender: false 因为这是一个 API 路由，需要在服务器端动态处理
        injectRoute({
          pattern: '/api/visit',
          entrypoint: './node_modules/@coffic/astro-visits/src/pages/api/visit.ts',
          prerender: false
        });

        logger.info(`✅ Integration setup complete with binding: ${binding}`);
      },
    },
  };
}