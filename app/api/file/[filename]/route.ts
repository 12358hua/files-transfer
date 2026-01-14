import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getFileByBlobUrl, incrementDownloadCount } from '@/lib/mysql/fileOperations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // 从环境变量获取上传目录
    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, filename);

    // 检查文件是否存在
    try {
      await stat(filePath);
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 从数据库获取原始文件名
    // 需要尝试两种URL格式：API格式和public uploads格式
    let fileRecord = await getFileByBlobUrl(`/api/file/${filename}`);
    
    // 如果在API格式中没找到，尝试public uploads格式
    if (!fileRecord) {
      fileRecord = await getFileByBlobUrl(`/uploads/${filename}`);
    }
    
    // 如果找不到记录或原始文件名为空，使用当前文件名
    const originalFilename = fileRecord?.filename || filename;
    
    // 增加下载次数（如果找到记录）
    if (fileRecord) {
      try {
        await incrementDownloadCount(fileRecord.share_id);
      } catch (error) {
        console.error('Failed to increment download count:', error);
        // 不影响文件下载，仅记录错误
      }
    }

    // 读取文件内容
    const fileBuffer = await readFile(filePath);

    // 获取文件的MIME类型
    const mimeType = getMimeType(originalFilename);
    
    // 返回文件内容
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(originalFilename)}"`,
        'Cache-Control': 'public, max-age=31536000', // 缓存一年
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 简单的MIME类型检测函数
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    case 'zip':
      return 'application/zip';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}