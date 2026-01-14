-- MySQL数据库表创建脚本 - 文件传输工具
-- 创建files表来存储文件元数据

CREATE TABLE `files` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `share_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `content_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blob_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL,
  `download_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_id` (`share_id`),
  KEY `idx_files_expires_at` (`expires_at`),
  KEY `idx_files_is_deleted` (`is_deleted`),
  KEY `idx_files_download_count` (`download_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 提示：由于MySQL不支持行级安全策略（如PostgreSQL），我们使用应用层逻辑来处理权限
-- 所有对数据库的操作都应该通过API进行，以确保安全性

-- 说明：
-- expires_at 字段存储文件过期时间，由应用逻辑设置，默认值根据环境变量 FILE_EXPIRY_SECONDS 确定（默认为86400秒=1天）
-- 可根据需要调整：
-- 60 = 1分钟
-- 300 = 5分钟
-- 3600 = 1小时
-- 86400 = 1天
-- 172800 = 2天
-- 604800 = 7天