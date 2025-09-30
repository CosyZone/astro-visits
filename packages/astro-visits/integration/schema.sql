-- 访问记录表
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    url TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    language TEXT,
    cookies TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    color_depth INTEGER,
    timezone TEXT,
    ip TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_visits_timestamp ON visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_visits_url ON visits(url);
CREATE INDEX IF NOT EXISTS idx_visits_ip ON visits(ip);