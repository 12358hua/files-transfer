import { executeQuery, getConnection, releaseConnection } from './db';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';

// 定义文件数据类型
export interface FileRecord {
  id: string;
  share_id: string;
  filename: string;
  file_size: number;
  content_type: string | null;
  blob_url: string;
  created_at: string;
  expires_at: string;
  is_deleted: number;
  deleted_at: string | null;
  download_count: number;
}

// 上传文件记录到数据库
export async function insertFileRecord(fileData: {
  share_id: string;
  filename: string;
  file_size: number;
  content_type: string;
  blob_url: string;
}): Promise<FileRecord | null> {
  const id = randomUUID(); // 生成UUID
  const expirySeconds = parseInt(process.env.FILE_EXPIRY_SECONDS || '86400', 10); // 默认1天 = 86400秒
  const query = `
    INSERT INTO files (id, share_id, filename, file_size, content_type, blob_url, expires_at, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ${expirySeconds} SECOND), 0)
  `;
  
  try {
    const results = await executeQuery<any>(query, [
      id,
      fileData.share_id,
      fileData.filename,
      fileData.file_size,
      fileData.content_type,
      fileData.blob_url
    ]);
    
    // 获取刚刚插入的记录
    const insertedRecord = await getFileByShareId(fileData.share_id);
    return insertedRecord;
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

// 根据分享ID获取文件记录
export async function getFileByShareId(shareId: string): Promise<FileRecord | null> {
  const query = 'SELECT * FROM files WHERE share_id = ? AND is_deleted = 0 LIMIT 1';
  
  try {
    const results = await executeQuery<FileRecord[]>(query, [shareId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Database select error:', error);
    throw error;
  }
}

// 根据分享ID删除文件记录（逻辑删除）
export async function deleteFileByShareId(shareId: string): Promise<boolean> {
  const query = 'UPDATE files SET is_deleted = 1, deleted_at = NOW() WHERE share_id = ?';
  
  try {
    const results = await executeQuery<any>(query, [shareId]);
    return true;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
}

// 根据blob URL获取文件记录
export async function getFileByBlobUrl(blobUrl: string): Promise<FileRecord | null> {
  const query = 'SELECT * FROM files WHERE blob_url = ? AND is_deleted = 0 LIMIT 1';
  
  try {
    const results = await executeQuery<FileRecord[]>(query, [blobUrl]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Database select error:', error);
    throw error;
  }
}

// 检查表是否存在，如果不存在则创建
export async function ensureFilesTableExists(): Promise<void> {
  const expirySeconds = parseInt(process.env.FILE_EXPIRY_SECONDS || '86400', 10); // 默认1天 = 86400秒
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`files\` (
      \`id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`share_id\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`filename\` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`file_size\` bigint(20) NOT NULL,
      \`content_type\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`blob_url\` text COLLATE utf8mb4_unicode_ci NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`expires_at\` timestamp NULL,
      \`is_deleted\` tinyint(1) DEFAULT 0,
      \`deleted_at\` timestamp NULL,
      \`download_count\` int(11) DEFAULT 0,
      
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`share_id\` (\`share_id\`),
      KEY \`idx_files_expires_at\` (\`expires_at\`),
      KEY \`idx_files_is_deleted\` (\`is_deleted\`),
      KEY \`idx_files_download_count\` (\`download_count\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  try {
    await executeQuery(createTableQuery);
    console.log('Files table ensured');
  } catch (error) {
    console.error('Error ensuring files table:', error);
    throw error;
  }
}

// 获取所有过期的文件记录
export async function getExpiredFiles(): Promise<FileRecord[]> {
  const query = 'SELECT * FROM files WHERE expires_at < NOW() AND is_deleted = 0';
  
  try {
    const results = await executeQuery<FileRecord[]>(query);
    return results;
  } catch (error) {
    console.error('Database select expired files error:', error);
    throw error;
  }
}

// 逻辑删除文件记录
export async function softDeleteFileByShareId(shareId: string): Promise<boolean> {
  const query = 'UPDATE files SET is_deleted = 1, deleted_at = NOW() WHERE share_id = ?';
  
  try {
    const results: any = await executeQuery(query, [shareId]);
    return results.affectedRows > 0;
  } catch (error) {
    console.error('Database soft delete file error:', error);
    throw error;
  }
}

// 删除过期的文件记录（逻辑删除）
export async function softDeleteExpiredFiles(): Promise<number> {
  const query = 'UPDATE files SET is_deleted = 1, deleted_at = NOW() WHERE expires_at < NOW() AND is_deleted = 0';
  
  try {
    const results: any = await executeQuery(query);
    return results.affectedRows || 0;
  } catch (error) {
    console.error('Database soft delete expired files error:', error);
    throw error;
  }
}

// 增加文件下载次数
export async function incrementDownloadCount(shareId: string): Promise<boolean> {
  const query = 'UPDATE files SET download_count = download_count + 1 WHERE share_id = ?';
  
  try {
    const results: any = await executeQuery(query, [shareId]);
    return results.affectedRows > 0;
  } catch (error) {
    console.error('Database increment download count error:', error);
    throw error;
  }
}

// 物理删除过期的已标记删除文件
export async function permanentlyDeleteOldFiles(daysToKeep: number = 30): Promise<number> {
  const query = `DELETE FROM files WHERE is_deleted = 1 AND deleted_at < DATE_SUB(NOW(), INTERVAL ${daysToKeep} DAY)`;
  
  try {
    const results: any = await executeQuery(query);
    return results.affectedRows || 0;
  } catch (error) {
    console.error('Database permanent delete old files error:', error);
    throw error;
  }
}