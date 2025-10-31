export interface ParsedUserAgent {
    /** 设备类型 */
    device: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    /** 操作系统名称 */
    os: string;
    /** 浏览器名称 */
    browser: string;
    /** 是否为机器人 */
    isBot: boolean;
}

