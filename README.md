# 文件传输工具

基于 Next.js 开发的文件在线传输工具，允许用户上传文件并生成分享链接，支持自动过期和清理功能。

## 🚀 功能特性

- **文件上传**：支持拖拽上传和点击上传
- **分享链接**：自动生成唯一的分享链接
- **文件下载**：通过分享链接下载文件
- **自动过期**：文件在指定时间后自动过期
- **下载统计**：记录文件下载次数
- **进度显示**：上传进度条显示
- **安全删除**：支持文件删除功能
- **本地存储**：使用本地文件系统存储上传的文件
- **MySQL 数据库**：使用 MySQL 存储文件元数据

![alt text](public/demo1.png)
![alt text](public/demo2.png)

## 🛠️ 技术栈

- **前端框架**: [Next.js](https://nextjs.org/) 16
- **UI 组件库**: [Shadcn UI](https://ui.shadcn.com/) 和 [Radix UI](https://www.radix-ui.com/)
- **数据库**: MySQL
- **状态管理**: React Hooks
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **文件上传**: 原生 HTML5 File API
- **构建工具**: pnpm

## 📦 安装与运行

### 先决条件

- Node.js >= 18.x
- MySQL 5.7+
- pnpm

### 安装步骤

1. 克隆项目仓库：

```bash
git clone https://github.com/12358hua/files-transfer
cd file-transfer-tool
```

2. 安装依赖：

```bash
pnpm install
```

3. 创建 MySQL 数据库：

```sql
CREATE DATABASE file_transfer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. 执行数据库表创建脚本：

```bash
scripts/001_create_files_table_mysql.sql
```

5. 复制环境变量配置文件：

```bash
cp .env.example .env.local
```

6. 编辑 `.env.local` 文件，配置数据库连接和其他设置：

```env
# MySQL 数据库配置
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=file_transfer_db
DB_PORT=3306

# 本地文件存储配置（可选）
UPLOAD_DIR=./public/uploads

# 文件过期设置（秒数，默认为1天）
FILE_EXPIRY_SECONDS=86400

```

6. 启动开发服务器：

```bash
pnpm dev
```

7. 打开浏览器访问 `http://localhost:3000`

## 🔧 配置选项

### 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `DB_HOST` | MySQL 数据库主机地址 | `localhost` |
| `DB_USER` | MySQL 用户名 | - |
| `DB_PASSWORD` | MySQL 密码 | - |
| `DB_NAME` | MySQL 数据库名 | - |
| `DB_PORT` | MySQL 端口 | `3306` |
| `UPLOAD_DIR` | 文件上传目录 | `./public/uploads` |
| `FILE_EXPIRY_SECONDS` | 文件过期时间（秒） | `86400` (1天) |

### 数据库表结构

数据库包含一个 `files` 表，用于存储文件元数据：

```sql
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
```


## 📁 项目结构

```
├── app/                    # Next.js 应用页面
│   ├── api/                # API 路由
│   │   ├── cleanup/        # 清理过期文件 API
│   │   ├── file/[filename]/ # 文件下载 API
│   │   ├── files/[shareId]/ # 文件信息 API
│   │   └── upload/         # 文件上传 API
│   ├── [shareId]/          # 文件分享页面
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 页面布局
│   └── page.tsx            # 首页
├── components/             # React 组件
│   ├── ui/                 # UI 组件库
│   ├── file-info.tsx       # 文件信息展示组件
│   ├── file-upload.tsx     # 文件上传组件
│   └── theme-provider.tsx  # 主题提供者
├── lib/                    # 工具函数和库
│   ├── mysql/              # MySQL 操作
│   │   ├── db.ts           # 数据库连接
│   │   ├── fileOperations.ts # 文件操作
│   │   ├── index.ts        # 导出入口
│   │   └── init.ts         # 初始化
│   └── utils/              # 工具函数
│       ├── autoCleanup.ts  # 自动清理
│       ├── fileStorage.ts  # 文件存储
│       └── initCleanup.ts  # 清理初始化
├── public/                 # 静态资源
│   └── uploads/            # 上传文件目录
├── scripts/                # 数据库脚本
└── ...
```

## 🗂️ API 接口

### 上传文件

```
POST /api/upload
```

上传文件到服务器，返回文件信息和分享链接。

请求格式：
- Content-Type: multipart/form-data
- 参数: file (文件)

响应示例：
```json
{
  "id": "uuid-string",
  "shareId": "unique-share-id",
  "filename": "example.pdf",
  "fileSize": 102400,
  "contentType": "application/pdf",
  "blobUrl": "/uploads/1678886400_random.pdf",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "expiresAt": "2023-01-02T00:00:00.000Z",
  "downloadCount": 0
}
```

### 获取文件信息

```
GET /api/files/:shareId
```

根据分享 ID 获取文件信息。

### 下载文件

```
GET /api/file/:filename
```

根据文件名下载文件。

### 删除文件

```
DELETE /api/files/:shareId
```

根据分享 ID 删除文件（逻辑删除）。

### 清理过期文件

```
POST /api/cleanup
```

手动清理过期文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进此项目！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 提交代码前请运行 `pnpm lint` 检查代码质量
- 请确保添加适当的单元测试
- 更新文档以反映所做的更改

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Shadcn UI](https://ui.shadcn.com/) - UI 组件库
- [Lucide](https://lucide.dev/) - 图标库

## 📞 支持

如果您对此项目有任何问题或建议，请随时提交 Issue 或发送邮件至 [1344160559@qq.com](mailto:1344160559@qq.com)。