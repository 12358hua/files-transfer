import { writeFile, unlink, access } from 'fs/promises';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';

/**
 * 本地文件存储工具类
 */
export class LocalFileStorage {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    // 优先使用传入的目录，然后是环境变量，最后是默认目录
    const envUploadDir = process.env.UPLOAD_DIR || '';
    this.uploadDir = uploadDir || (envUploadDir ? envUploadDir : join(process.cwd(), 'public', 'uploads'));
  }

  /**
   * 保存文件到本地
   * @param fileBuffer 文件的buffer
   * @param originalName 原始文件名
   * @returns 保存后的文件路径
   */
  async saveFile(fileBuffer: Buffer, originalName: string): Promise<string> {
    // 生成唯一的文件名
    const fileExtension = this.getFileExtension(originalName);
    const uniqueFileName = `${this.generateUniqueFileName()}${fileExtension}`;
    const filePath = join(this.uploadDir, uniqueFileName);

    // 确保上传目录存在
    await this.ensureUploadDir();

    // 写入文件
    await writeFile(filePath, fileBuffer);

    // 如果上传目录是public子目录，返回相对URL路径；否则返回一个API路径
    if (this.uploadDir.includes(join(process.cwd(), 'public'))) {
      return `/uploads/${uniqueFileName}`;
    } else {
      // 如果是外部目录，返回一个API路径，通过API来提供文件
      return `/api/file/${uniqueFileName}`;
    }
  }

  /**
   * 删除本地文件
   * @param fileUrl 文件的URL路径
   * @returns 是否删除成功
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // 从URL中提取文件名
      let fileName = fileUrl.split('/').pop();
      
      // 如果URL是 /api/file/ 格式，直接使用文件名
      // 如果URL是 /uploads/ 格式，也需要提取文件名
      if (fileUrl.includes('/api/file/') || fileUrl.includes('/uploads/')) {
        fileName = fileUrl.split('/').pop();
      }
      
      if (!fileName) {
        console.error(`Invalid file URL: ${fileUrl}`);
        return false;
      }

      const filePath = join(this.uploadDir, fileName);

      // 检查文件是否存在
      try {
        await access(filePath);
      } catch {
        // 文件不存在，直接返回成功
        console.warn(`File not found for deletion: ${filePath}`);
        return true;
      }

      // 删除文件
      await unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete file: ${fileUrl}`, error);
      return false;
    }
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDir(): Promise<void> {
    // 这里可以使用 Node.js 的 fs 模块来检查和创建目录
    // 但在 Next.js 环境中，我们假设目录已存在或由开发者创建
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return filename.substring(lastDotIndex);
  }

  /**
   * 生成唯一文件名
   */
  private generateUniqueFileName(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(4).toString('hex');
    return `${timestamp}_${randomPart}`;
  }
}

// 创建默认实例
const defaultStorage = new LocalFileStorage();

export default defaultStorage;