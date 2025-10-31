import type { ParsedUserAgent } from '../types/user-agent';

/**
 * 检测是否为机器人
 */
function detectBot(ua: string): boolean {
    const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper',
        'googlebot', 'bingbot', 'slurp', 'duckduckbot',
        'baiduspider', 'yandexbot', 'facebookexternalhit',
        'twitterbot', 'rogerbot', 'linkedinbot',
        'embedly', 'quora', 'pinterest', 'slackbot',
        'whatsapp', 'flipboard', 'tumblr', 'bitlybot',
        'skypeuripreview', 'nuzzel', 'discordbot',
        'qwantify', 'pinterestbot', 'bitrixlinkpreview',
        'xing-contenttabreceiver', 'chrome-lighthouse',
        'telegrambot', 'applebot', 'ia_archiver',
        'archive.org_bot', 'megaindex', 'dotbot',
        'sogou', 'exabot', 'facebot', 'ia_archiver',
        'curl', 'wget', 'python-requests', 'go-http-client',
        'java/', 'php/', 'ruby', 'perl', 'node'
    ];

    return botPatterns.some(pattern => ua.includes(pattern));
}

/**
 * 检测设备类型
 */
function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
    // 移动设备
    if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        // 区分平板和手机
        if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
            return 'tablet';
        }
        return 'mobile';
    }

    // 桌面设备
    if (/windows|macintosh|linux/i.test(ua) && !/android|mobile/i.test(ua)) {
        return 'desktop';
    }

    return 'unknown';
}

/**
 * 检测操作系统
 */
function detectOS(ua: string): string {
    const lowerUA = ua.toLowerCase();

    // Windows
    if (lowerUA.includes('windows nt 10.0')) return 'Windows 10/11';
    if (lowerUA.includes('windows nt 6.3')) return 'Windows 8.1';
    if (lowerUA.includes('windows nt 6.2')) return 'Windows 8';
    if (lowerUA.includes('windows nt 6.1')) return 'Windows 7';
    if (lowerUA.includes('windows nt 6.0')) return 'Windows Vista';
    if (lowerUA.includes('windows nt 5.1')) return 'Windows XP';
    if (lowerUA.includes('windows nt 5.0')) return 'Windows 2000';
    if (lowerUA.includes('windows')) return 'Windows';

    // macOS
    if (lowerUA.includes('mac os x') || lowerUA.includes('macintosh')) {
        const match = ua.match(/mac os x ([\d_]+)/i);
        if (match) {
            return `macOS ${match[1].replace(/_/g, '.')}`;
        }
        return 'macOS';
    }

    // Android
    if (lowerUA.includes('android')) {
        const match = ua.match(/android ([\d.]+)/i);
        return match ? `Android ${match[1]}` : 'Android';
    }

    // iOS
    if (lowerUA.includes('iphone os') || lowerUA.includes('iphone')) {
        const match = ua.match(/iphone os ([\d_]+)/i);
        if (match) {
            return `iOS ${match[1].replace(/_/g, '.')}`;
        }
        return 'iOS';
    }

    // iPadOS
    if (lowerUA.includes('ipad')) {
        const match = ua.match(/os ([\d_]+)/i);
        if (match) {
            return `iPadOS ${match[1].replace(/_/g, '.')}`;
        }
        return 'iPadOS';
    }

    // Linux 发行版
    if (lowerUA.includes('ubuntu')) return 'Ubuntu';
    if (lowerUA.includes('fedora')) return 'Fedora';
    if (lowerUA.includes('debian')) return 'Debian';
    if (lowerUA.includes('centos')) return 'CentOS';
    if (lowerUA.includes('redhat') || lowerUA.includes('rhel')) return 'Red Hat';
    if (lowerUA.includes('linux')) return 'Linux';

    return 'Unknown';
}

/**
 * 检测浏览器
 */
function detectBrowser(ua: string): string {
    const lowerUA = ua.toLowerCase();

    // Edge (Chromium)
    if (lowerUA.includes('edg/') || lowerUA.includes('edgios/') || lowerUA.includes('edgandroid')) {
        return 'Edge';
    }

    // Chrome (不是 Edge)
    if (lowerUA.includes('chrome/') && !lowerUA.includes('edg')) {
        return 'Chrome';
    }

    // Firefox
    if (lowerUA.includes('firefox/')) {
        return 'Firefox';
    }

    // Safari (不是 Chrome)
    if (lowerUA.includes('safari/') && !lowerUA.includes('chrome')) {
        return 'Safari';
    }

    // Opera
    if (lowerUA.includes('opr/') || lowerUA.includes('opera/')) {
        return 'Opera';
    }

    // Internet Explorer / Edge Legacy
    if (lowerUA.includes('msie') || lowerUA.includes('trident/')) {
        return 'Internet Explorer';
    }

    // Samsung Internet
    if (lowerUA.includes('samsungbrowser/')) {
        return 'Samsung Internet';
    }

    // UC Browser
    if (lowerUA.includes('ucbrowser/')) {
        return 'UC Browser';
    }

    return 'Unknown';
}

/**
 * 解析 User Agent 字符串
 * @param userAgent - User Agent 字符串
 * @returns 解析结果
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
    if (!userAgent || typeof userAgent !== 'string') {
        return {
            device: 'unknown',
            os: 'Unknown',
            browser: 'Unknown',
            isBot: false
        };
    }

    const ua = userAgent.toLowerCase();

    // 检测机器人
    const isBot = detectBot(ua);

    // 检测设备类型
    const device = detectDevice(userAgent);

    // 检测操作系统
    const os = detectOS(userAgent);

    // 检测浏览器
    const browser = detectBrowser(userAgent);

    return { device, os, browser, isBot };
}

/**
 * 快速检测是否为机器人（独立函数，性能优化）
 * @param userAgent - User Agent 字符串
 * @returns 是否为机器人
 */
export function isBot(userAgent: string): boolean {
    if (!userAgent || typeof userAgent !== 'string') {
        return false;
    }
    return detectBot(userAgent.toLowerCase());
}

