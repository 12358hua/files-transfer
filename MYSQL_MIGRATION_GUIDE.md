# MySQL 迁移指南

本指南详细介绍了如何将项目从 Supabase(PostgreSQL) 迁移到 MySQL 数据库。

## 1. 安装依赖

项目已安装 mysql2 依赖：
```bash
pnpm add mysql2
```

## 2. 数据库表结构

MySQL 表结构定义在 `scripts/001_create_files_table_mysql.sql` 中：

```sql
CREATE TABLE `files` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `share_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `content_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blob_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_id` (`share_id`),
  KEY `idx_files_share_id` (`share_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 3. 环境变量配置

更新 `.env.local` 文件：

```
# MySQL 数据库配置
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=file_transfer_db
DB_PORT=3306

# Vercel Blob 配置（如果使用）
# NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN=your_blob_token
```

## 4. 数据库连接

项目使用连接池管理数据库连接，位于 `lib/mysql/db.ts`。

## 5. 执行步骤

### 步骤 1: 创建 MySQL 数据库
```sql
CREATE DATABASE file_transfer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 步骤 2: 执行数据库表创建脚本
```bash
mysql -u your_username -p file_transfer_db < scripts/001_create_files_table_mysql.sql
```

### 步骤 3: 配置环境变量
更新 `.env.local` 文件中的数据库连接参数。

### 步骤 4: 安装依赖
```bash
pnpm install
```

### 步骤 5: 启动应用
```bash
pnpm dev
```

### 步骤 6: 多环境配置

项目支持多环境配置：

- **开发环境**：使用 `.env.local` 文件
- **生产环境**：在部署平台设置环境变量（如 Vercel、Netlify 等）或通过系统环境变量设置

## 6. 主要变更

- 移除了对 Supabase 的依赖
- 添加了 MySQL 连接池管理
- 更新了 API 路由以使用 MySQL 查询
- 修改了数据模型以适应 MySQL 语法

## 7. API 更改

### 上传 API (`/api/upload`)
- 从 Supabase 插入改为 MySQL 插入
- 从 Vercel Blob 存储改为本地文件系统存储
- 保持相同的返回格式

### 文件获取 API (`/api/files/[shareId]`)
- 从 Supabase 查询改为 MySQL 查询
- 保持相同的返回格式

### 文件删除 API (`/api/files/[shareId]`)
- 从 Supabase 删除改为 MySQL 删除
- 从 Vercel Blob 删除改为本地文件系统删除
- 保持相同的返回格式

## 8. 完整迁移

项目已完全从 Supabase 迁移到 MySQL，并从 Vercel Blob 迁移到本地文件存储。

- 已删除的文件：
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
- 已替换所有 Supabase API 调用为 MySQL 查询
- 已替换所有 Vercel Blob 操作为本地文件系统操作

## 9. 本地文件存储

项目现在使用本地文件系统存储上传的文件。

- 默认存储路径：`public/uploads` 目录
- 自定义存储路径：通过环境变量 `UPLOAD_DIR` 配置
- 文件命名规则：时间戳 + 随机字符 + 原始文件扩展名
- 自动清理：删除记录时同时删除对应的本地文件
- 文件访问：
  - 如果存储在 `public` 目录下，直接通过 `/uploads/filename` 访问
  - 如果存储在外部目录，通过 `/api/file/filename` API 访问

## 10. 自动过期功能

项目支持文件自动过期和清理功能：

- 默认过期时间：1天（86400秒，可通过 `FILE_EXPIRY_SECONDS` 环境变量调整，如：60=1分钟，3600=1小时，86400=1天）
- 自动清理：每60分钟运行一次（可通过 `CLEANUP_INTERVAL_MINUTES` 环境变量调整）
- 过期检查：访问分享链接时会检查文件是否过期
- 手动清理：可通过 `/api/cleanup` API手动触发清理

## 11. 逻辑删除功能

项目现在使用逻辑删除代替物理删除：

- `is_deleted` 字段：标记文件是否被删除（0=未删除，1=已删除）
- `deleted_at` 字段：记录删除时间
- 删除操作：更新标记而非物理删除，保留日志记录
- 物理清理：过期文件在被标记30天后进行物理删除（可通过代码调整）

## 12. 自动清理配置

项目支持通过环境变量控制自动清理功能：

- `ENABLE_AUTO_CLEANUP`：是否启用自动清理功能（true/false，默认true）
- `FILE_EXPIRY_SECONDS`：文件过期时间（秒）

**注意**：自动清理功能现在只支持手动触发，通过访问 `/api/cleanup` 接口来清理过期文件。建议通过以下方式执行自动清理：

1. 使用部署平台的cron功能（如Vercel Cron Jobs）定期调用 `/api/cleanup` 接口
2. 在服务器环境中设置系统cron任务调用清理接口
3. 手动访问 `/api/cleanup` 接口进行清理

## 13. 新增功能

项目现在支持以下新功能：

- **上传进度条**：在上传文件时显示实时进度
- **下载次数统计**：记录每个文件的下载次数并显示在文件信息中
- **数据库字段**：新增 `download_count` 字段用于记录下载次数