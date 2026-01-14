import { getExpiredFiles, softDeleteExpiredFiles, permanentlyDeleteOldFiles } from '@/lib/mysql/fileOperations';
import fileStorage from '@/lib/utils/fileStorage';
import { FileRecord } from '@/lib/mysql/fileOperations';

/**
 * 自动清理过期文件
 */
export async function autoCleanupExpiredFiles(): Promise<void> {
  console.log('开始清理过期文件...');
  
  try {
    // 获取所有过期的文件记录
    const expiredFiles = await getExpiredFiles();
    
    if (expiredFiles.length === 0) {
      console.log('没有过期文件需要清理');
      return;
    }
    
    console.log(`找到 ${expiredFiles.length} 个过期文件`);
    
    // 逐个删除过期文件的本地存储
    for (const fileRecord of expiredFiles) {
      try {
        const deleted = await fileStorage.deleteFile(fileRecord.blob_url);
        if (deleted) {
          console.log(`已删除过期文件: ${fileRecord.filename} (${fileRecord.blob_url})`);
        } else {
          console.warn(`删除过期文件失败: ${fileRecord.filename} (${fileRecord.blob_url})`);
        }
      } catch (error) {
        console.error(`删除本地文件时出错:`, error);
        // 即使删除本地文件失败，也要继续删除数据库记录
      }
    }
    
    // 从数据库中逻辑删除过期记录
    const deletedCount = await softDeleteExpiredFiles();
    console.log(`已从数据库逻辑删除 ${deletedCount} 个过期文件记录`);
    
  } catch (error) {
    console.error('自动清理过期文件时出错:', error);
    throw error;
  }
}

