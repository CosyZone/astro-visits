export const CLIENT_SCRIPT_TEMPLATE = `
if (%%DISABLE_IN_DEV%% === true && import.meta.env.DEV) {
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
  }).catch((err) => {
    console.error('[astro-visits] Failed to send visit data:', err);
  });
}
`.trim();