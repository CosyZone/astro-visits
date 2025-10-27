/**
 * 生成客户端跟踪脚本
 * @param ignorePaths 要忽略的路径列表
 * @returns 完整的客户端脚本字符串
 */
export function generateClientScript(ignorePaths: string[]): string {
    return `
    (function() {
      /**
       * 检查路径是否应该被忽略
       */
      function shouldIgnorePath(pathname, ignorePaths) {
        return ignorePaths.some(pattern => {
          // 精确匹配
          if (pattern === pathname) {
            return true;
          }
          
          // 通配符匹配 (如 /api/*)
          if (pattern.includes('*')) {
            const regexPattern = pattern
              .replace(/\\*/g, '.*')
              .replace(/\\//g, '\\\\/');
            const regex = new RegExp('^' + regexPattern + '$');
            return regex.test(pathname);
          }
          
          return false;
        });
      }

      // 获取忽略路径配置
      const ignorePaths = ${JSON.stringify(ignorePaths)};
      const currentPath = window.location.pathname;
      
      // 检查当前路径是否应该被忽略
      if (shouldIgnorePath(currentPath, ignorePaths)) {
        console.debug('[astro-visits] Path ignored: ' + currentPath);
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
        };

        // 发送数据到服务器端点
        fetch('/api/visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visitData),
        }).catch((err) => {
          console.error('[astro-visits] Failed to send visit data:', err);
        });
      }
    })();
  `;
}

