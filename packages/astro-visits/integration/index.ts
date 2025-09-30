import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    name: 'astro-visits',
    hooks: {
      'astro:config:setup': ({ injectScript, injectRoute, logger }) => {
        // 注入客户端脚本以收集访问者信息（从独立文件读取并替换占位符）
        const clientScriptPath = join(__dirname, 'client.js');
        const clientScriptRaw = readFileSync(clientScriptPath, 'utf-8');
        const clientScript = clientScriptRaw.replace(/%%DISABLE_IN_DEV%%/g, String(!trackDev));
        injectScript('page', clientScript);

        // 注入API路由
        injectRoute({
          pattern: '/api/visit',
          entrypoint: join(__dirname, '..', 'src', 'pages', 'api', 'visit.ts')
        });

        logger.info('✅ Integration setup complete');
      },
    },
  };
}