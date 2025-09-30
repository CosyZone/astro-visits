import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
      'astro:config:setup': ({ injectScript, injectRoute }) => {
        // 注入客户端脚本以收集访问者信息
        injectScript('page', `
          if (${!trackDev} && import.meta.env.DEV) {
            console.debug('[astro-visits] Tracking disabled in development mode');
          } else {
            // 收集访问者信息
            const visitData = {
              timestamp: new Date().toISOString(),
              url: window.location.href,
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              language: navigator.language,
              cookies: document.cookie,
              screenWidth: screen.width,
              screenHeight: screen.height,
              colorDepth: screen.colorDepth,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              // IP地址将在服务器端获取
            };
            
            // 发送数据到服务器端点
            fetch('/api/visit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(visitData),
            }).catch(err => {
              console.error('[astro-visits] Failed to send visit data:', err);
            });
          }
        `);

        // 注入API路由
        injectRoute({
          pattern: '/api/visit',
          entrypoint: join(__dirname, '..', 'src', 'pages', 'api', 'visit.ts')
        });
      },

      'astro:server:setup': ({ server }) => {
        // 在开发服务器中添加中间件来模拟D1数据库
        server.middlewares.use((req, _res, next) => {
          // 为开发环境提供模拟的D1数据库对象
          (req as any).locals = (req as any).locals || {};
          (req as any).locals.runtime = {
            env: {
              [binding]: {
                prepare: () => ({
                  bind: (...args: any[]) => ({
                    run: async () => {
                      console.log('[astro-visits] Mock D1 database insert:', args);
                      return { success: true };
                    }
                  })
                })
              }
            }
          };
          next();
        });
      }
    },
  };
}